/**
 * helpers.ts - 工具函数
 * 通用辅助方法集合
 */

/**
 * 生成指定范围的随机整数 [min, max]
 */
export function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成指定范围的随机浮点数 [min, max)
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 将值限制在 [min, max] 范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 概率判定
 * @param chance 概率 (0-1)
 * @returns 是否命中
 */
export function chance(chance: number): boolean {
  return Math.random() < chance;
}

/**
 * 延迟指定毫秒
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 洗牌算法 (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 创建DOM元素的快捷方法
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  textContent?: string
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (textContent !== undefined) {
    el.textContent = textContent;
  }
  return el;
}

/**
 * 百分比格式化
 */
export function formatPercent(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/**
 * 数组随机取一个
 */
export function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
