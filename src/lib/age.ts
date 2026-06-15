/* ============================================================
   蛋糕日 CakeDay — 年龄 / 生日倒计时计算
   ============================================================ */

const DAY = 86400000;

export interface AgeInfo {
  /** 创建至今总天数 */
  ageDays: number;
  /** 已过完的整周岁 */
  years: number;
  /** 距下个周年（生日）天数；未满 1 岁时即距第一个生日 */
  daysToNext: number;
  isBirthdayToday: boolean;
}

/** 把日期归零到当天 0 点本地时间 */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * 取时间戳"书写时区"的日历日期（与 createdLabel = iso.slice(0,10) 一致）。
 * 直接解析 ISO 的 YYYY-MM-DD，避免 `new Date()` 按浏览器时区解析造成跨日漂移。
 */
function createdCalendarDate(createdISO: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(createdISO);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return startOfDay(new Date(createdISO));
}

export function ageInfo(createdISO: string, now: Date = new Date()): AgeInfo {
  const created = createdCalendarDate(createdISO);
  const today = startOfDay(now);

  // 全部用本地午夜日期相减；Math.round 抵御 DST（23/25 小时的那种天），无 DST 地区则精确
  const ageDays = Math.max(0, Math.round((today.getTime() - created.getTime()) / DAY));

  let years = today.getFullYear() - created.getFullYear();
  const m = today.getMonth() - created.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < created.getDate())) years--;
  years = Math.max(0, years);

  // 下一个周年：直接用 today 的年 + created 的月/日构造，与 today 同为本地午夜，
  // 避免残留时分秒被 ceil 多算一天。生日当天 next==today → 推到明年（倒计时归 365），
  // 满岁卡片此时由 isBirthdayToday 短路显示「今天生日」。
  const next = new Date(today.getFullYear(), created.getMonth(), created.getDate());
  if (next <= today) next.setFullYear(today.getFullYear() + 1);
  const daysToNext = Math.max(0, Math.round((next.getTime() - today.getTime()) / DAY));

  const isBirthdayToday =
    created.getMonth() === today.getMonth() && created.getDate() === today.getDate();

  return { ageDays, years, daysToNext, isBirthdayToday };
}

export type AgeTier = 'young' | 'mid' | 'elder';
export function tierOf(age: number): AgeTier {
  return age >= 5 ? 'elder' : age >= 3 ? 'mid' : 'young';
}

export function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}
