/* ============================================================
   蛋糕日 CakeDay — 文案与语气（俏皮地吐槽 Cangjie 关 issue 慢）
   ============================================================ */

export const COPY = {
  brand: '蛋糕日',
  brandEn: 'CakeDay',

  // S1 landing
  landingOneLine: '给 Cangjie 的高龄 issue 送生日蛋糕',
  landingNote: '只读取你的 issue，代你发一条祝福评论。',
  loginBtn: '用 GitCode 登录',

  // S2 登录中
  loginLoading: '正在点蜡烛…',
  loginLoadingSub: '正在和 GitCode 握手，马上好',

  // S3 summary
  summaryHeadline: (n: number) =>
    `你有 <b>${n}</b> 个超过 1 岁的老 issue，Cangjie 还没顾上关它们`,
  summaryElder: (age: number) =>
    `其中最年长的已经 ${age} 周岁，建议默哀三秒再送蛋糕。`,
  summaryPending: (m: number) => ` 另有 ${m} 个还没满 1 岁，正在排队等生日。`,
  // 名下有 open issue 但全部未满 1 岁时的概要
  summaryNoneEligible: '你名下还没有满 1 岁的老 issue 🎂',
  summaryAllPending: (m: number) => `有 ${m} 个还没满 1 岁，正在排队等生日。`,

  // empty
  emptyTitle: '你名下一个 open 的 issue 都没有 🎉',
  emptyBody:
    '不管满没满 1 岁，你在 Cangjie 都没有还开着的 issue。要么提的都被关掉了，要么……你根本没提过。今天不用切蛋糕。',
  emptyTag: '// no open issues found — 难得清爽',

  // errors（官方口吻）
  errExpiredTitle: '登录已失效',
  errExpiredBody: '你的 GitCode 登录状态已过期，请重新登录后继续。',
  errExpiredBtn: '重新登录',
  errLoadTitle: '加载失败',
  errLoadBody: '获取 issue 列表时出错，请检查网络连接后重试。',
  errLoadBtn: '重试',
  errRateTitle: '请求过于频繁',
  errRateBody: '操作过于频繁，已被 GitCode 限流，请稍后再试。',
  errRateBtn: '稍后重试',

  // toasts
  toastSent: '蛋糕已送达！这个 issue 今天有人记得它了 🎂',
  toastAlready: '它今天已经吃过蛋糕啦，别撑着它 😋',
  toastFail: '发送失败，请重试。',
  toastRate: '操作过于频繁，请稍后再试。',
  toastNotConfigured: '请先在 src/config.ts 填入 GitCode 应用的 client_id / client_secret。',
  toastLoginFailed: '登录失败，请重试。',
  toastStateMismatch: '登录校验失败（state 不匹配），请重试。',

  // button states
  btnIdle: '送蛋糕',
  btnChecking: '检测中…',
  btnSending: '发送中…',
  btnSent: '已送达',
  btnFailed: '重试',

  // preview / dialog
  previewLabel: '将发布到该 issue 评论区：',

  // footer
  footer: '源码',
  repoUrl: 'https://github.com/Zxilly/cangjie-issue-birthday',
} as const;
