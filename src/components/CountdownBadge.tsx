/** 未满 1 岁 issue 的倒计时徽章 */
export function CountdownBadge({ days }: { days: number }) {
  return (
    <span className="age-badge tier-pending" aria-label={`还有 ${days} 天满 1 岁`}>
      <span className="num">{days}</span>
      <span className="unit">天满 1 岁</span>
    </span>
  );
}
