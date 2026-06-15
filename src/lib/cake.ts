/* ============================================================
   蛋糕日 CakeDay — 生日祝福语模板 + 防重标记
   ============================================================ */

// 发布到评论里的隐藏标记（HTML 注释，GitCode markdown 不渲染它）。
// 送蛋糕前会拉取该 issue 的评论、检索此标记来判断是否已经送过。
export const CAKE_MARKER = '<!-- 🎂 cakeday-bot -->';

/** 可见的祝福语（固定模板，自动带入周岁，用户不编辑） */
export function blessingFor(age: number): string {
  return `🎂 这个 issue 已经 ${age} 周岁 啦！感谢它这么多年如一日地挂在这里、稳定地没被关掉。祝它生日快乐，也愿它早日修成正果、光荣 close ～ 🎉`;
}

/** 实际提交到评论区的正文 = 祝福语 + 隐藏防重标记 */
export function buildCakeComment(age: number): string {
  return `${blessingFor(age)}\n\n${CAKE_MARKER}`;
}

/** 评论列表里是否已存在本应用发过的蛋糕 */
export function hasCakeComment(comments: { body?: string | null }[]): boolean {
  return comments.some((c) => (c.body ?? '').includes(CAKE_MARKER));
}
