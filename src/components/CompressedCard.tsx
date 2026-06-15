import { Ico } from './icons';
import { CountdownBadge } from './CountdownBadge';
import type { Issue } from '../lib/types';

/** 未满 1 岁的 issue：压缩单行展示，沉到列表底部，尚不能送蛋糕 */
export function CompressedCard({ issue, index }: { issue: Issue; index: number }) {
  return (
    <article
      className="card card-compressed card-enter"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <CountdownBadge days={issue.daysToNext} />
      <div className="cc-body">
        <a className="card-title cc-title" href={issue.url} target="_blank" rel="noopener noreferrer">
          {issue.title}
        </a>
        <div className="card-meta">
          <span className="repo-name mono">{issue.repo}</span>
          <span className="sep" />
          <span className="date-text">{issue.createdLabel}</span>
        </div>
      </div>
      <span className="pending-note">还没到生日</span>
      <a
        className="ext-link cc-ext"
        href={issue.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="在 GitCode 打开原 issue（新标签页）"
      >
        <Ico.ext />
      </a>
    </article>
  );
}
