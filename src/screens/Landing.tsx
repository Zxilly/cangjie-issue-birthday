import { Brand, ThemeToggle } from '../components/Header';
import { IssueCard } from '../components/IssueCard';
import { Ico } from '../components/icons';
import { COPY } from '../lib/copy';
import { blessingFor } from '../lib/cake';
import { ageInfo, fmtDate } from '../lib/age';
import type { CSSProperties } from 'react';
import type { Issue } from '../lib/types';

// 落地页右侧「产品实拍」用的示例 issue（纯展示）
function sampleIssue(): Issue {
  const createdISO = '2020-09-03T00:00:00+08:00';
  const info = ageInfo(createdISO);
  return {
    number: '4012',
    owner: 'Cangjie',
    repo: 'cangjie_compiler',
    title: '泛型实例化在跨模块场景下偶发类型擦除，希望补全错误诊断信息',
    createdISO,
    createdLabel: fmtDate(createdISO),
    url: 'https://gitcode.com/Cangjie/cangjie_compiler/issues/4012',
    comments: 27,
    age: info.years,
    ageDays: info.ageDays,
    daysToNext: info.daysToNext,
    isBirthdayToday: info.isBirthdayToday,
    eligible: info.years >= 1,
  };
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
  const sample = sampleIssue();
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
          <div className="peek">
            <div className="peek-card">
              <IssueCard issue={sample} btnState="sent" onSend={() => {}} layout="compact" index={0} />
            </div>
            <div className="peek-comment">
              <div className="pc-avatar">OK</div>
              <div className="pc-body">
                <div className="pc-meta mono">octo_kai 在 #{sample.number} 评论 · 刚刚</div>
                <p className="pc-text">{blessingFor(sample.age)}</p>
              </div>
            </div>
          </div>
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
