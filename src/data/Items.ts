/**
 * Items.ts - 道具定义
 * 与 types.ts 中已预留的 Item 接口对接
 *
 * 药水分三种「大中小」：
 *  - 小药水(绿)：恢复 30% 最大HP
 *  - 中药水(蓝)：恢复 60% 最大HP
 *  - 大药水(金)：完全恢复
 * 每种都有可视化 SVG 药水瓶图案（见 utils/PotionIcon.ts）
 */

import type { Item } from './types';

/** 道具列表 */
export const ITEMS: Item[] = [
  {
    id: 1,
    name: '小药水',
    type: 'potion',
    healAmount: 30,
    color: '#26de81',
    description: '恢复当前出战精灵 30% 最大HP',
  },
  {
    id: 2,
    name: '中药水',
    type: 'superPotion',
    healAmount: 60,
    color: '#4facfe',
    description: '恢复当前出战精灵 60% 最大HP',
  },
  {
    id: 3,
    name: '大药水',
    type: 'fullRestore',
    healAmount: 100,
    color: '#ffd24a',
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
