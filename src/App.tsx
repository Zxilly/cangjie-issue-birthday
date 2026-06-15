/* ============================================================
   蛋糕日 CakeDay — 主编排
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Header } from './components/Header';
import { Confetti } from './components/Confetti';
import { ToastStack } from './components/ToastStack';
import { ConfirmDialog } from './components/ConfirmDialog';
import { SkeletonCard } from './components/SkeletonCard';
import { Landing } from './screens/Landing';
import { LoginLoading } from './screens/LoginLoading';
import { EmptyState } from './screens/EmptyState';
import { ErrorState } from './screens/ErrorState';
import { IssueListView, type SortMode } from './screens/IssueListView';

import { useTheme } from './hooks/useTheme';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';

import { COPY } from './lib/copy';
import { isConfigured } from './lib/config';
import { buildAuthorizeUrl, exchangeCodeForToken } from './lib/oauth';
import { clearToken, getValidToken, hasToken, saveToken } from './lib/tokenStore';
import {
  ApiError,
  AuthError,
  RateLimitError,
  getCurrentUser,
  getIssueComments,
  getMyOrgIssues,
  postIssueComment,
} from './lib/gitcode';
import { buildCakeComment, hasCakeComment } from './lib/cake';
import { issueKey } from './lib/types';
import type {
  AppUser,
  CakeButtonState,
  ErrorKind,
  Issue,
  ToastItem,
  ToastKind,
} from './lib/types';

type Screen = 'landing' | 'callback' | 'list';
type ListState = 'loading' | 'ready' | 'empty' | 'error';

const OAUTH_STATE_KEY = 'cakeday.oauth_state';
const SENT_KEY = 'cakeday.sent';

const FALLBACK_USER: AppUser = {
  login: 'me',
  name: '我',
  avatarUrl: '',
  htmlUrl: '',
  initials: '我',
  avatarHue: 38,
};

/* ---- 已送蛋糕本地缓存（即时 UI；权威判断仍靠送出时拉评论） ---- */
function loadSent(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SENT_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}
function addSent(key: string): void {
  const s = loadSent();
  s.add(key);
  localStorage.setItem(SENT_KEY, JSON.stringify([...s]));
}

function cleanUrl(): void {
  window.history.replaceState({}, '', '/');
}

export function App() {
  const [dark, toggleTheme] = useTheme();
  const reduceMotion = usePrefersReducedMotion();

  const [screen, setScreen] = useState<Screen>('landing');
  const [listState, setListState] = useState<ListState>('loading');
  const [errorKind, setErrorKind] = useState<ErrorKind>('load');

  const [user, setUser] = useState<AppUser | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [btnStates, setBtnStates] = useState<Record<string, CakeButtonState>>({});
  const [sort, setSort] = useState<SortMode>('age');

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [burst, setBurst] = useState(0);
  const [confirm, setConfirm] = useState<Issue | null>(null);

  const booted = useRef(false);

  /* ---------------- helpers ---------------- */
  const pushToast = useCallback((kind: ToastKind, msg: string) => {
    const id = crypto.randomUUID();
    setToasts((cur) => [...cur, { id, kind, msg }]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 3400);
  }, []);

  const fireConfetti = useCallback(() => {
    if (reduceMotion) return;
    const b = Date.now();
    setBurst(b);
    // 略大于单片彩纸最长存活（delay 0.35s + dur 3.1s = 3.45s），避免尾部被提前截断
    setTimeout(() => setBurst((cur) => (cur === b ? 0 : cur)), 3600);
  }, [reduceMotion]);

  const setBtn = useCallback((key: string, s: CakeButtonState) => {
    setBtnStates((cur) => ({ ...cur, [key]: s }));
  }, []);

  /* ---------------- data ---------------- */
  const loadIssues = useCallback(async () => {
    setListState('loading');
    try {
      const token = await getValidToken();
      if (!token) {
        setErrorKind('expired');
        setListState('error');
        return;
      }
      const [u, list] = await Promise.all([
        getCurrentUser(token).catch(() => null),
        getMyOrgIssues(token),
      ]);
      if (u) setUser(u);

      const sentCache = loadSent();
      const states: Record<string, CakeButtonState> = {};
      for (const it of list) {
        const k = issueKey(it);
        states[k] = sentCache.has(k) ? 'sent' : 'idle';
      }
      setBtnStates(states);
      setIssues(list);
      setListState(list.length === 0 ? 'empty' : 'ready');
    } catch (e) {
      if (e instanceof AuthError) setErrorKind('expired');
      else if (e instanceof RateLimitError) setErrorKind('rate');
      else setErrorKind('load');
      setListState('error');
    }
  }, []);

  const handleCallback = useCallback(
    async (code: string, stateParam: string | null) => {
      setScreen('callback');
      const saved = sessionStorage.getItem(OAUTH_STATE_KEY);
      sessionStorage.removeItem(OAUTH_STATE_KEY); // state 单次有效，读出即消费（成功/失败都不残留）
      if (!saved || saved !== stateParam) {
        cleanUrl();
        pushToast('error', COPY.toastStateMismatch);
        setScreen('landing');
        return;
      }
      try {
        const tok = await exchangeCodeForToken(code);
        saveToken(tok);
        cleanUrl();
        setScreen('list');
        await loadIssues();
      } catch {
        cleanUrl();
        pushToast('error', COPY.toastLoginFailed);
        setScreen('landing');
      }
    },
    [loadIssues, pushToast],
  );

  /* ---------------- bootstrap (once, StrictMode-safe) ---------------- */
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const stateParam = params.get('state');
    const authError = params.get('error');
    if (authError) {
      // 用户在 GitCode 拒绝授权 / 授权出错会带 ?error=... 回跳（无 code）——给反馈并清理 URL
      cleanUrl();
      pushToast('error', COPY.toastLoginFailed);
    }
    if (code) {
      void handleCallback(code, stateParam);
    } else if (hasToken()) {
      setScreen('list');
      void loadIssues();
    } else {
      setScreen('landing');
    }
  }, [handleCallback, loadIssues]);

  /* ---------------- auth actions ---------------- */
  const doLogin = useCallback(() => {
    if (!isConfigured()) {
      pushToast('warn', COPY.toastNotConfigured);
      return;
    }
    const state = crypto.randomUUID();
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    window.location.href = buildAuthorizeUrl(state);
  }, [pushToast]);

  const doLogout = useCallback(() => {
    clearToken();
    setUser(null);
    setIssues([]);
    setBtnStates({});
    setScreen('landing');
  }, []);

  /* ---------------- send a cake ---------------- */
  const performSend = useCallback(
    async (issue: Issue) => {
      const key = issueKey(issue);
      // 同步置为 checking，立刻禁用按钮，避免确认后到 token 返回的间隙被重复触发
      setBtn(key, 'checking');
      const token = await getValidToken();
      if (!token) {
        setBtn(key, 'idle');
        setErrorKind('expired');
        setListState('error');
        return;
      }
      try {
        // 权威防重：先看该 issue 是否已存在本应用发过的蛋糕评论
        const comments = await getIssueComments(token, issue.owner, issue.repo, issue.number);
        if (hasCakeComment(comments)) {
          setBtn(key, 'sent');
          addSent(key);
          pushToast('success', COPY.toastAlready);
          return;
        }
        setBtn(key, 'sending');
        await postIssueComment(
          token,
          issue.owner,
          issue.repo,
          issue.number,
          buildCakeComment(issue.age),
        );
        setBtn(key, 'sent');
        addSent(key);
        pushToast('success', COPY.toastSent);
        fireConfetti();
      } catch (e) {
        if (e instanceof RateLimitError) {
          setBtn(key, 'idle');
          pushToast('warn', COPY.toastRate);
        } else if (e instanceof AuthError) {
          setBtn(key, 'idle');
          setErrorKind('expired');
          setListState('error');
        } else {
          // 包含 ApiError 与网络错误
          setBtn(key, 'failed');
          pushToast('error', COPY.toastFail);
          if (e instanceof ApiError) console.error(e);
        }
      }
    },
    [setBtn, pushToast, fireConfetti],
  );

  const sendCake = useCallback((issue: Issue) => setConfirm(issue), []);

  /* ============================================================
     RENDER
     ============================================================ */
  let body: ReactNode;

  if (screen === 'landing') {
    body = <Landing dark={dark} onToggleTheme={toggleTheme} onLogin={doLogin} />;
  } else if (screen === 'callback') {
    body = <LoginLoading />;
  } else {
    body = (
      <div className="app-shell">
        <Header
          user={user ?? FALLBACK_USER}
          dark={dark}
          onToggleTheme={toggleTheme}
          onLogout={doLogout}
        />
        <main className="page">
          <div className="container">
            {listState === 'ready' && (
              <IssueListView
                issues={issues}
                btnStates={btnStates}
                sort={sort}
                onSort={setSort}
                onSend={sendCake}
                layout="compact"
              />
            )}

            {listState === 'loading' && (
              <>
                <section className="summary">
                  <div className="skeleton-bar" style={{ width: '70%', height: 34, marginBottom: 12 }} />
                </section>
                <div className="toolbar">
                  <div className="skeleton-bar" style={{ width: 160, height: 16 }} />
                  <div className="skeleton-bar" style={{ width: 180, height: 40, borderRadius: 12 }} />
                </div>
                <div className="list">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </>
            )}

            {listState === 'empty' && <EmptyState />}

            {listState === 'error' && (
              <ErrorState
                kind={errorKind}
                onAction={() => {
                  if (errorKind === 'expired') doLogout();
                  else void loadIssues();
                }}
              />
            )}
          </div>
        </main>
        <footer className="footer">
          <div className="ft">
            {COPY.footer} ·{' '}
            <a href={COPY.repoUrl} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <>
      {body}
      <Confetti burst={burst} reduceMotion={reduceMotion} />
      <ToastStack toasts={toasts} />
      <ConfirmDialog
        issue={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const i = confirm;
          setConfirm(null);
          if (i) void performSend(i);
        }}
      />
    </>
  );
}
