import type { CSSProperties } from 'react';
import { COPY } from '../lib/copy';

const CANDLE: CSSProperties = {
  position: 'absolute',
  bottom: 18,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 6,
  height: 58,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 3,
};

const FLAME: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 74,
  width: 14,
  height: 20,
  transform: 'translateX(-50%)',
  background: 'radial-gradient(circle at 50% 70%, var(--gold), var(--gold-deep))',
  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
  boxShadow: '0 0 16px var(--accent-glow)',
  animation: 'flame-flicker 1.1s ease-in-out infinite',
};

/** S3-b · 空状态：一个 open 的 issue 都没有（含未满 1 岁的） */
export function EmptyState() {
  return (
    <div className="center-screen">
      <div className="scene" aria-hidden="true">
        {/* 空盘上一支点亮的蜡烛 —— 没什么要庆祝的，而这是好事 */}
        <div className="disc" />
        <div style={CANDLE} />
        <div className="flame" style={FLAME} />
      </div>
      <div>
        <h2 style={{ marginBottom: 10 }}>{COPY.emptyTitle}</h2>
        <p>{COPY.emptyBody}</p>
      </div>
      <span className="empty-tag">{COPY.emptyTag}</span>
    </div>
  );
}
