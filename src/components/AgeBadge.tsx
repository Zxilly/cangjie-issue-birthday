import { tierOf } from '../lib/age';

/** 周岁徽章：随年龄递进强调（young / mid / elder） */
export function AgeBadge({ age }: { age: number }) {
  const tier = tierOf(age);
  return (
    <span className={`age-badge tier-${tier}`} aria-label={`${age} 周岁`}>
      <span className="num">{age}</span>
      <span className="unit">周岁</span>
    </span>
  );
}
