/* ============================================================
   蛋糕日 CakeDay — GitCode OpenAPI 客户端
   ============================================================ */
import { API_BASE, ORG } from './config';
import { ageInfo, fmtDate } from './age';
import type { AppUser, Issue } from './types';

/** 401：登录失效 */
export class AuthError extends Error {}
/** 429：触发限流 */
export class RateLimitError extends Error {}
/** 其它 HTTP 错误 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function api(path: string, token: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) throw new AuthError('未授权');
  if (res.status === 429) throw new RateLimitError('已被限流');
  if (!res.ok) throw new ApiError(`请求失败：HTTP ${res.status}`, res.status);
  return res;
}

/* ---------------- 当前用户 ---------------- */
interface RawUser {
  login: string;
  name?: string;
  avatar_url?: string;
  html_url?: string;
}

export async function getCurrentUser(token: string): Promise<AppUser> {
  const res = await api('/user', token);
  const u = (await res.json()) as RawUser;
  const display = u.name || u.login || '我';
  return {
    login: u.login,
    name: display,
    avatarUrl: u.avatar_url ?? '',
    htmlUrl: u.html_url ?? '',
    initials: (u.login || u.name || '?').slice(0, 2).toUpperCase(),
    avatarHue: 38,
  };
}

/* ---------------- issue 映射 ---------------- */
interface RawIssue {
  number?: string | number;
  title?: string;
  created_at?: string;
  html_url?: string;
  url?: string;
  comments?: number;
  repository?: {
    full_name?: string;
    path?: string;
    path_with_namespace?: string;
    namespace?: { path?: string };
  };
}

function mapIssue(raw: RawIssue): Issue | null {
  const htmlUrl = raw.html_url ?? raw.url ?? '';
  let owner = ORG;
  let repo = '';
  let number = raw.number != null ? String(raw.number) : '';

  const fullName = raw.repository?.full_name ?? raw.repository?.path_with_namespace;
  if (fullName && fullName.includes('/')) {
    const idx = fullName.indexOf('/');
    owner = fullName.slice(0, idx);
    repo = fullName.slice(idx + 1);
  } else if (raw.repository?.path) {
    repo = raw.repository.path;
    owner = raw.repository.namespace?.path ?? ORG;
  }

  // 回退：从 html_url 解析 owner/repo/number
  if ((!repo || !number) && htmlUrl) {
    const m = htmlUrl.match(/gitcode\.com\/([^/]+)\/([^/]+)\/issues\/([^/?#]+)/);
    if (m) {
      owner = repo ? owner : m[1];
      repo = repo || m[2];
      number = number || m[3];
    }
  }

  if (!repo || !number) return null;

  const createdISO = raw.created_at ?? '';
  const info = ageInfo(createdISO);
  return {
    number,
    owner,
    repo,
    title: raw.title ?? '(无标题)',
    createdISO,
    createdLabel: createdISO ? fmtDate(createdISO) : '',
    url: htmlUrl || `https://gitcode.com/${owner}/${repo}/issues/${number}`,
    comments: raw.comments ?? 0,
    age: info.years,
    ageDays: info.ageDays,
    daysToNext: info.daysToNext,
    isBirthdayToday: info.isBirthdayToday,
    eligible: info.years >= 1,
  };
}

/**
 * 拉取「当前登录用户在 Cangjie 组织里创建的、未关闭的」全部 issue（分页直到取完）。
 *
 * 不用 `/orgs/{org}/issues`：实测对 `Cangjie` 该端点恒返回空（filter=created/all/默认
 * 皆 200 但 0 条），即使应用已开通组织权限也一样——GitCode 的 org issue 端点查不到这些
 * issue。改用 `/user/issues`（列出当前用户创建的 issue，跨全部仓库，返回项带 repository
 * .full_name），再在前端按 owner === ORG 过滤出目标组织。
 *
 * 命名注意：本函数并不调用任何 `/orgs` 端点，别据名改回 `/orgs/{org}/issues`。
 */
export async function getMyCreatedIssues(token: string): Promise<Issue[]> {
  const out: Issue[] = [];
  const PER_PAGE = 100;
  const org = ORG.toLowerCase();
  // /user/issues 跨用户全部仓库，靠下方 arr.length<PER_PAGE 自然翻完；page 上限只是防御性
  // 死循环保护（50×100=5000 条，远超个人创建量）。
  for (let page = 1; page <= 50; page++) {
    // 不要带 sort 参数：GitCode 的 /user/issues 会把它当作 order_by 校验，sort=created
    // 会触发 400「Invalid query parameter: order_by, enum value required」。列表在前端自行排序。
    const q = new URLSearchParams({
      filter: 'created',
      state: 'open',
      per_page: String(PER_PAGE),
      page: String(page),
    });
    const res = await api(`/user/issues?${q.toString()}`, token);
    const arr = (await res.json()) as RawIssue[];
    if (!Array.isArray(arr) || arr.length === 0) break;
    for (const raw of arr) {
      const mapped = mapIssue(raw);
      if (mapped && mapped.owner.toLowerCase() === org) out.push(mapped);
    }
    if (arr.length < PER_PAGE) break;
  }
  return out;
}

/* ---------------- 评论 ---------------- */
export interface RawComment {
  id: number;
  body: string;
}

export async function getIssueComments(
  token: string,
  owner: string,
  repo: string,
  number: string,
): Promise<RawComment[]> {
  const out: RawComment[] = [];
  const PER_PAGE = 100;
  for (let page = 1; page <= 10; page++) {
    const q = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page) });
    const res = await api(
      `/repos/${owner}/${repo}/issues/${number}/comments?${q.toString()}`,
      token,
    );
    const arr = (await res.json()) as RawComment[];
    if (!Array.isArray(arr) || arr.length === 0) break;
    out.push(...arr);
    if (arr.length < PER_PAGE) break;
  }
  return out;
}

export async function postIssueComment(
  token: string,
  owner: string,
  repo: string,
  number: string,
  body: string,
): Promise<RawComment> {
  const res = await api(`/repos/${owner}/${repo}/issues/${number}/comments`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  return (await res.json()) as RawComment;
}
