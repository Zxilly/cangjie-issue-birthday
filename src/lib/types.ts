/* ============================================================
   蛋糕日 CakeDay — 共享类型
   ============================================================ */

export interface AppUser {
  login: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
  initials: string;
  avatarHue: number;
}

export interface Issue {
  /** issue 编号（字符串，用于 API 路径） */
  number: string;
  /** 仓库所属空间（一般即组织名 Cangjie） */
  owner: string;
  /** 仓库 path slug，如 cangjie_runtime */
  repo: string;
  title: string;
  /** ISO 创建时间，如 2023-04-20T07:49:54+08:00 */
  createdISO: string;
  /** 展示用日期 YYYY-MM-DD */
  createdLabel: string;
  /** 原 issue 链接 */
  url: string;
  /** 评论数 */
  comments: number;

  // 计算字段
  /** 已过完的整周岁 */
  age: number;
  /** 创建至今总天数 */
  ageDays: number;
  /** 距下个生日（周年）天数 */
  daysToNext: number;
  isBirthdayToday: boolean;
  /** age >= 阈值，可送蛋糕 */
  eligible: boolean;
}

/** 卡片唯一键（repo + number 防跨仓库编号冲突） */
export function issueKey(i: Pick<Issue, 'repo' | 'number'>): string {
  return `${i.repo}#${i.number}`;
}

export type CakeButtonState = 'idle' | 'checking' | 'sending' | 'sent' | 'failed';

export type ToastKind = 'success' | 'error' | 'warn';
export interface ToastItem {
  id: string;
  kind: ToastKind;
  msg: string;
}

export type ErrorKind = 'expired' | 'load' | 'rate';
