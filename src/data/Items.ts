/**
 * Items.ts - 道具定义
 * 与 types.ts 中已预留的 Item 接口对接
 */

import type { Item } from './types';

/** 道具列表 */
export const ITEMS: Item[] = [
  {
    id: 1,
    name: '回复药水',
    type: 'potion',
    healAmount: 30,
    description: '恢复当前出战精灵 30% 最大HP',
  },
  {
    id: 2,
    name: '高级药水',
    type: 'superPotion',
    healAmount: 60,
    description: '恢复当前出战精灵 60% 最大HP',
  },
  {
    id: 3,
    name: '全复药',
    type: 'fullRestore',
    healAmount: 100,
    description: '完全恢复当前出战精灵的HP',
  },
];

/** 根据ID获取道具定义 */
export function getItemById(id: number): Item | undefined {
  return ITEMS.find(i => i.id === id);
}

/** 根据道具类型获取恢复比例（相对最大HP） */
export function getItemHealRatio(type: Item['type']): number {
  switch (type) {
    case 'potion': return 0.3;
    case 'superPotion': return 0.6;
    case 'fullRestore': return 1.0;
    default: return 0.3;
  }
}
