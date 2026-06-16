import { useEffect, useState } from 'react';
import { IssueCard } from './IssueCard';
import { blessingFor } from '../lib/cake';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { issueKey, type Issue } from '../lib/types';

const ROTATE_MS = 3800;

/**
 * 落地页右侧的「风琴包扇形层叠轮播」：把若干真实满周岁 issue 像折页褶层那样叠起，最前
 * 一张完整正立、其后两张错位上移+缩小+微倾露出边缘（样式见 .deck-item），自动轮换
 *（hover 暂停、prefers-reduced-motion 下不自动转、小圆点可手动切换）。下方评论气泡跟随
 * 当前卡片。纯展示，外层 aria-hidden。
 */
export function IssueDeck({ issues }: { issues: Issue[] }) {
  const n = issues.length;
  const reduce = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused || n <= 1) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % n), ROTATE_MS);
    return () => clearTimeout(id);
  }, [active, reduce, paused, n]);

  const current = issues[active];

  return (
    <div
      className="peek"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="deck">
        {issues.map((issue, i) => {
          const slot = (i - active + n) % n; // 0=最前，1/2=身后
          return (
            <div key={issueKey(issue)} className={`deck-item s${Math.min(slot, 2)}`}>
              <IssueCard issue={issue} btnState="sent" onSend={() => {}} layout="compact" index={i} />
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <div className="deck-dots">
          {issues.map((issue, i) => (
            <button
              key={issueKey(issue)}
              type="button"
              tabIndex={-1}
              aria-label={`显示第 ${i + 1} 个示例`}
              className={`deck-dot${i === active ? ' on' : ''}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}

      <div className="peek-comment">
        <div className="pc-avatar">Zx</div>
        <div className="pc-body" key={active}>
          <div className="pc-meta mono">Zxilly 在 #{current.number} 评论 · 刚刚</div>
          <p className="pc-text">{blessingFor(current.age)}</p>
        </div>
      </div>
    </div>
  );
}
