import type { CSSProperties } from 'react';

/** 纯 CSS 蛋糕图形，尺寸由 --cs 控制 */
export function Cake({ size = 24, style }: { size?: number; style?: CSSProperties }) {
  return (
    <span className="cake" style={{ '--cs': `${size}px`, ...style } as CSSProperties} aria-hidden="true">
      <span className="flame" />
      <span className="candle" />
      <span className="frosting" />
      <span className="base" />
      <span className="plate" />
    </span>
  );
}
