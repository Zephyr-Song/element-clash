/**
 * StatusIcons.ts - 异常状态图标组件
 * （已集成到PetSprite中，此文件提供独立的状态图标创建工具函数）
 */

export function createStatusIcon(status: string): HTMLSpanElement | null {
  const emojiMap: Record<string, string> = {
    poison: '🟣', burn: '🔥', paralyze: '⚡', freeze: '❄️', sleep: '💤', confuse: '🌀',
  };
  const nameMap: Record<string, string> = {
    poison: '中毒', burn: '灼烧', paralyze: '麻痹', freeze: '冰冻', sleep: '睡眠', confuse: '混乱',
  };

  const emoji = emojiMap[status];
  if (!emoji) return null;

  const span = document.createElement('span');
  span.className = 'status-icon';
  span.textContent = emoji;
  span.title = nameMap[status] || status;
  return span;
}
