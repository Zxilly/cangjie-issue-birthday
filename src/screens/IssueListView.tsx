import { IssueCard, type CardLayout } from '../components/IssueCard';
import { COPY } from '../lib/copy';
import { issueKey } from '../lib/types';
import type { CakeButtonState, Issue } from '../lib/types';

export type SortMode = 'age' | 'repo';

/** S3 · 主列表（ready 态）：概要 + 排序工具栏 + 卡片列表 */
export function IssueListView({
  issues,
  btnStates,
  sort,
  onSort,
  onSend,
  layout = 'compact',
}: {
  issues: Issue[];
  btnStates: Record<string, CakeButtonState>;
  sort: SortMode;
  onSort: (s: SortMode) => void;
  onSend: (issue: Issue) => void;
  layout?: CardLayout;
}) {
  const eligible = issues.filter((i) => i.eligible);
  const pendingCount = issues.length - eligible.length;
  const oldest = eligible.reduce((m, x) => Math.max(m, x.age), 0);
  const activeCount = eligible.length;
  const hasEligible = activeCount > 0;

  // activeCount 可能为 0（名下 open issue 全部未满 1 岁）——此时换一套不矛盾的文案
  const headlineHtml = hasEligible ? COPY.summaryHeadline(activeCount) : COPY.summaryNoneEligible;
  const subText = hasEligible
    ? COPY.summaryElder(oldest) + (pendingCount > 0 ? COPY.summaryPending(pendingCount) : '')
    : COPY.summaryAllPending(pendingCount);
  const countText = hasEligible
    ? `${activeCount} 个可送 · 最年长 ${oldest} 周岁${pendingCount > 0 ? ` · ${pendingCount} 个待满岁` : ''}`
    : `${pendingCount} 个还没满 1 岁`;

  const sorted = [...issues].sort((a, b) => {
    if (sort === 'age') return b.ageDays - a.ageDays;
    return a.repo.localeCompare(b.repo) || b.ageDays - a.ageDays;
  });

  return (
    <>
      <section className="summary">
        <div>
          <h1 className="big" dangerouslySetInnerHTML={{ __html: headlineHtml }} />
          <div className="sub">{subText}</div>
        </div>
      </section>

      <div className="toolbar">
        <span className="count">{countText}</span>
        <div className="seg" role="group" aria-label="排序方式">
          <button aria-pressed={sort === 'age'} onClick={() => onSort('age')}>
            最年长在前
          </button>
          <button aria-pressed={sort === 'repo'} onClick={() => onSort('repo')}>
            按仓库
          </button>
        </div>
      </div>

      <div className="list">
        {sorted.map((issue, i) => {
          const k = issueKey(issue);
          return (
            <IssueCard
              key={k}
              issue={issue}
              index={i}
              btnState={btnStates[k] ?? 'idle'}
              onSend={() => onSend(issue)}
              layout={layout}
            />
          );
        })}
      </div>
    </>
  );
}
