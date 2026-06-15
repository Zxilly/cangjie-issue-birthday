import type { CSSProperties } from 'react';

// blue 配色的彩纸（与设计稿一致）
const PALETTE = ['#5B63CF', '#7B82DD', '#3F47B8', '#AEB2EC', '#E0B24A'];

/** 送达成功的庆祝彩纸；burst 改变即触发一轮，约 2–3s 飘落 */
export function Confetti({ burst, reduceMotion }: { burst: number; reduceMotion: boolean }) {
  if (reduceMotion || !burst) return null;

  const count = 64;
  const pieces = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const cx = (Math.random() * 2 - 1) * 200;
    const dur = 2.0 + Math.random() * 1.1;
    const delay = Math.random() * 0.35;
    const rot = (Math.random() * 2 - 1) * 720;
    const color = PALETTE[i % PALETTE.length];
    const w = 8 + Math.random() * 5;
    const round = Math.random() > 0.6;
    const style: CSSProperties = {
      left: `${left}vw`,
      background: color,
      width: w,
      height: round ? w : w * 1.5,
      borderRadius: round ? '50%' : '2px',
      animationDelay: `${delay}s`,
      '--cx': `${cx}px`,
      '--cr': `${rot}deg`,
      '--cd': `${dur}s`,
      '--ce': 'ease-in',
    } as CSSProperties;
    return <i key={`${burst}-${i}`} style={style} />;
  });

  return (
    <div className="confetti-layer" key={burst} aria-hidden="true">
      {pieces}
    </div>
  );
}
