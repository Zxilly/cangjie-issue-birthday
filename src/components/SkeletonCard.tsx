import type { CSSProperties } from 'react';

const Bar = ({ style }: { style: CSSProperties }) => <div className="skeleton-bar" style={style} />;

/** 列表加载骨架卡 */
export function SkeletonCard() {
  return (
    <div className="sk-card" aria-hidden="true">
      <div className="sk-row">
        <Bar style={{ width: 78, height: 30, borderRadius: 999 }} />
        <Bar style={{ width: 120, height: 22, borderRadius: 999 }} />
        <Bar style={{ width: 90, height: 14 }} />
      </div>
      <Bar style={{ width: '84%', height: 20, marginBottom: 9 }} />
      <Bar style={{ width: '56%', height: 20 }} />
      <div className="sk-bottom">
        <Bar style={{ width: 140, height: 14 }} />
        <Bar style={{ width: 132, height: 44, borderRadius: 12 }} />
      </div>
    </div>
  );
}
