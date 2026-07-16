/**
 * Elements.ts - 属性enum + 完整相克表矩阵
 * 定义8种核心属性的克制关系
 */

import type { Element } from './types';

/**
 * 属性相克矩阵
 * 获取 attacker 对 defender 的伤害倍率
 *
 * 核心克制关系：
 * 火 > 草、冰、虫
 * 水 > 火、岩、地
 * 草 > 水、地、岩
 * 电 > 水、飞
 * 冰 > 草、龙、地
 * 龙 > 龙
 * 恶 > 萌、幽灵
 *
 * 被克制关系：
 * 火 < 水、地、岩
 * 水 < 草、电
 * 草 < 火、飞
 * 电 < 地
 * 冰 < 火、岩
 */
const typeChart: Record<string, Record<string, number>> = {
  fire: {
    fire: 0.5, water: 0.5, grass: 2, electric: 1, ice: 2, dragon: 1,
    normal: 1, dark: 1, rock: 0.5, flying: 1, poison: 1, steel: 2,
    psychic: 1, ground: 1, bug: 2, fighting: 1,
  },
  water: {
    fire: 2, water: 0.5, grass: 0.5, electric: 1, ice: 1, dragon: 1,
    normal: 1, dark: 1, rock: 2, flying: 1, poison: 1, steel: 1,
    psychic: 1, ground: 2, bug: 1, fighting: 1,
  },
  grass: {
    fire: 0.5, water: 2, grass: 0.5, electric: 1, ice: 1, dragon: 1,
    normal: 1, dark: 1, rock: 2, flying: 0.5, poison: 0.5, steel: 0.5,
    psychic: 1, ground: 2, bug: 0.5, fighting: 1,
  },
  electric: {
    fire: 1, water: 2, grass: 0.5, electric: 0.5, ice: 1, dragon: 0.5,
    normal: 1, dark: 1, rock: 1, flying: 2, poison: 1, steel: 1,
    psychic: 1, ground: 0, bug: 1, fighting: 1,
  },
  ice: {
    fire: 0.5, water: 0.5, grass: 2, electric: 1, ice: 0.5, dragon: 2,
    normal: 1, dark: 1, rock: 1, flying: 2, poison: 1, steel: 0.5,
    psychic: 1, ground: 2, bug: 1, fighting: 1,
  },
  dragon: {
    fire: 1, water: 1, grass: 1, electric: 1, ice: 1, dragon: 2,
    normal: 1, dark: 1, rock: 1, flying: 1, poison: 1, steel: 0.5,
    psychic: 1, ground: 1, bug: 1, fighting: 1,
  },
  normal: {
    fire: 1, water: 1, grass: 1, electric: 1, ice: 1, dragon: 1,
    normal: 1, dark: 1, rock: 0.5, flying: 1, poison: 1, steel: 0.5,
    psychic: 1, ground: 1, bug: 1, fighting: 1,
  },
  dark: {
    fire: 1, water: 1, grass: 1, electric: 1, ice: 1, dragon: 1,
    normal: 1, dark: 0.5, rock: 1, flying: 1, poison: 1, steel: 0.5,
    psychic: 2, ground: 1, bug: 1, fighting: 0.5,
  },
  rock: {
    fire: 2, water: 1, grass: 1, electric: 1, ice: 2, dragon: 1,
    normal: 1, dark: 1, rock: 1, flying: 2, poison: 1, steel: 0.5,
    psychic: 1, ground: 0.5, bug: 2, fighting: 0.5,
  },
  flying: {
    fire: 1, water: 1, grass: 2, electric: 1, ice: 1, dragon: 1,
    normal: 1, dark: 1, rock: 0.5, flying: 1, poison: 1, steel: 0.5,
    psychic: 1, ground: 1, bug: 2, fighting: 2,
  },
  poison: {
    fire: 1, water: 1, grass: 2, electric: 1, ice: 1, dragon: 1,
    normal: 1, dark: 1, rock: 0.5, flying: 1, poison: 0.5, steel: 0,
    psychic: 1, ground: 0.5, bug: 1, fighting: 1,
  },
  steel: {
    fire: 0.5, water: 0.5, grass: 1, electric: 0.5, ice: 2, dragon: 1,
    normal: 1, dark: 1, rock: 2, flying: 1, poison: 1, steel: 0.5,
    psychic: 1, ground: 1, bug: 1, fighting: 1,
  },
  psychic: {
    fire: 1, water: 1, grass: 1, electric: 1, ice: 1, dragon: 1,
    normal: 1, dark: 0, rock: 1, flying: 1, poison: 2, steel: 0.5,
    psychic: 0.5, ground: 1, bug: 1, fighting: 2,
  },
  ground: {
    fire: 2, water: 1, grass: 0.5, electric: 2, ice: 1, dragon: 1,
    normal: 1, dark: 1, rock: 2, flying: 0, poison: 2, steel: 2,
    psychic: 1, ground: 1, bug: 0.5, fighting: 1,
  },
  bug: {
    fire: 0.5, water: 1, grass: 2, electric: 1, ice: 1, dragon: 1,
    normal: 1, dark: 2, rock: 1, flying: 0.5, poison: 0.5, steel: 0.5,
    psychic: 1, ground: 1, bug: 1, fighting: 0.5,
  },
  fighting: {
    fire: 1, water: 1, grass: 1, electric: 1, ice: 2, dragon: 1,
    normal: 2, dark: 2, rock: 2, flying: 0.5, poison: 0.5, steel: 2,
    psychic: 0.5, ground: 1, bug: 0.5, fighting: 1,
  },
};

/**
 * 获取属性克制倍率
 * @param attack 攻击方属性
 * @param defend 防御方属性
 * @returns 伤害倍率 (0, 0.25, 0.5, 1, 2, 4)
 */
export function getEffectiveness(attack: Element, defend: Element): number {
  const attackerChart = typeChart[attack];
  if (!attackerChart) return 1;
  const multiplier = attackerChart[defend];
  return multiplier !== undefined ? multiplier : 1;
}

/**
 * 获取有效性描述文字
 * @param multiplier 倍率
 * @returns 描述文字
 */
export function getEffectivenessText(multiplier: number): string {
  if (multiplier >= 4) return '极致效果拔群!!';
  if (multiplier >= 2) return '效果拔群!';
  if (multiplier <= 0) return '完全没有效果...';
  if (multiplier <= 0.25) return '几乎没有效果...';
  if (multiplier <= 0.5) return '效果不佳...';
  return '';
}
