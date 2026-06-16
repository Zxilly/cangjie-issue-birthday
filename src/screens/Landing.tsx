import { Brand, ThemeToggle } from '../components/Header';
import { IssueDeck } from '../components/IssueDeck';
import { Ico } from '../components/icons';
import { COPY } from '../lib/copy';
import { ageInfo, fmtDate } from '../lib/age';
import type { CSSProperties } from 'react';
import type { Issue } from '../lib/types';

// 落地页右侧层叠轮播用的真实示例（取自 Cangjie/UsersForum 的满周岁 issue，纯展示）。
// 数据快照于 2026-06；年龄/倒计时由 ageInfo 按当前日期实时计算。
const SHOWCASE_RAW = [
  {
    number: '518',
    title: '【需求】支持 ccache/sccache 缓存',
    createdISO: '2024-07-24T15:23:29+08:00',
    comments: 7,
  },
  {
    number: '811',
    title: '【缺陷】无法在宏包中编写单元测试',
    createdISO: '2024-08-19T03:33:50+08:00',
    comments: 1,
  },
  {
    number: '833',
    title: '【咨询】如何在编译期计算 Expr 的类型？',
    createdISO: '2024-08-20T21:20:59+08:00',
    comments: 6,
  },
] as const;

function showcaseIssues(): Issue[] {
  return SHOWCASE_RAW.map((r) => {
    const info = ageInfo(r.createdISO);
    return {
      number: r.number,
      owner: 'Cangjie',
      repo: 'UsersForum',
      title: r.title,
      createdISO: r.createdISO,
      createdLabel: fmtDate(r.createdISO),
      url: `https://gitcode.com/Cangjie/UsersForum/issues/${r.number}`,
      comments: r.comments,
      age: info.years,
      ageDays: info.ageDays,
      daysToNext: info.daysToNext,
      isBirthdayToday: info.isBirthdayToday,
      eligible: info.years >= 1,
    };
  });
}

const TRANSPARENT_APPBAR: CSSProperties = {
  background: 'transparent',
  backdropFilter: 'none',
  borderBottom: 'none',
};

export function Landing({
  dark,
  onToggleTheme,
  onLogin,
}: {
  dark: boolean;
  onToggleTheme: () => void;
  onLogin: () => void;
}) {
  const showcase = showcaseIssues();
  return (
    <div className="landing bg-festive layout-split">
      <header className="appbar" style={TRANSPARENT_APPBAR}>
        <div className="container appbar-inner">
          <Brand onClick={(e) => e.preventDefault()} />
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        </div>
      </header>

      <main className="landing-main">
        <div className="landing-copy">
          <h1>{COPY.landingOneLine}</h1>
          <div className="cta-row">
            <button className="btn btn-primary btn-gitcode" onClick={onLogin}>
              <Ico.code /> {COPY.loginBtn}
            </button>
            <span className="privacy">
              <Ico.shield /> {COPY.landingNote}
            </span>
          </div>
        </div>

        <div className="landing-visual" aria-hidden="true">
          <IssueDeck issues={showcase} />
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
