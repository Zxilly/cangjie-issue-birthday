import type { CSSProperties } from 'react';
import { Ico } from './icons';
import { AgeBadge } from './AgeBadge';
import { CakeButton } from './CakeButton';
import { CompressedCard } from './CompressedCard';
import type { CakeButtonState, Issue } from '../lib/types';

export type CardLayout = 'comfortable' | 'compact' | 'split';

export function IssueCard({
  issue,
  btnState,
  onSend,
  layout = 'compact',
  index,
}: {
  issue: Issue;
  btnState: CakeButtonState;
  onSend: () => void;
  layout?: CardLayout;
  index: number;
}) {
  // 未满 1 岁 → 压缩卡
  if (!issue.eligible) return <CompressedCard issue={issue} index={index} />;

  const badge = <AgeBadge age={issue.age} />;
  const titleBlock = (
    <div className="card-title-row">
      <a className="card-title" href={issue.url} target="_blank" rel="noopener noreferrer">
        {issue.title}
      </a>
      <a
        className="ext-link"
        href={issue.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="在 GitCode 打开原 issue（新标签页）"
      >
        <Ico.ext />
      </a>
    </div>
  );
  const meta = (
    <div className="card-meta">
      <span className="repo-name mono">{issue.repo}</span>
      <span className="sep" />
      <span className="date-text">{issue.createdLabel}</span>
      <span className="sep" />
      <span className="bday-countdown">
        {issue.isBirthdayToday ? '今天生日' : `距下个生日 ${issue.daysToNext} 天`}
      </span>
    </div>
  );
  const button = <CakeButton state={btnState} onSend={onSend} />;
  const delay: CSSProperties = { animationDelay: `${Math.min(index, 8) * 40}ms` };

  if (layout === 'split') {
    return (
      <article className="card layout-split card-enter" style={delay}>
        <div className="rail">{badge}</div>
        <div>
          {titleBlock}
          <div style={{ marginTop: 8 }}>{meta}</div>
          <div className="card-bottom">{button}</div>
        </div>
      </article>
    );
  }

  if (layout === 'compact') {
    return (
      <article className="card layout-compact card-enter" style={delay}>
        <div className="card-top" style={{ marginBottom: 8 }}>
          {badge}
          {meta}
        </div>
        {titleBlock}
        <div className="card-bottom">{button}</div>
      </article>
    );
  }

  // comfortable (default)
  return (
    <article className="card card-enter" style={delay}>
      <div className="card-top">
        {badge}
        {meta}
      </div>
      {titleBlock}
      <div className="card-bottom">{button}</div>
    </article>
  );
}
