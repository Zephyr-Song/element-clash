/**
 * PotionIcon.ts - 药水可视化图案
 * 用内联 SVG 渲染玻璃瓶 + 彩色液体，液面高度随药水大小（大/中/小）变化。
 * 返回 HTML 字符串，可直接塞进 innerHTML / template literal。
 */

import type { Item } from '../data/types';

let flaskSeq = 0;

/**
 * 渲染一个药水瓶 SVG
 * @param color 液体颜色
 * @param fillRatio 液面比例(0-1)，1=满
 * @param size 像素尺寸
 */
export function renderFlask(color: string, fillRatio: number, size = 56): string {
  flaskSeq += 1;
  const cid = `flaskclip${flaskSeq}`;
  const ratio = Math.max(0.08, Math.min(1, fillRatio));
  const liquidTop = 88 - ratio * 44;

  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <clipPath id="${cid}">
      <path d="M44,12 L44,40 C44,42 30,55 30,68 A20,20 0 0 0 70,68 C70,55 56,42 56,40 L56,12 Z"/>
    </clipPath>
  </defs>
  <g clip-path="url(#${cid})">
    <rect x="18" y="${liquidTop}" width="64" height="80" fill="${color}"/>
    <rect x="18" y="${liquidTop}" width="64" height="5" fill="rgba(255,255,255,0.4)"/>
  </g>
  <path d="M44,12 L44,40 C44,42 30,55 30,68 A20,20 0 0 0 70,68 C70,55 56,42 56,40 L56,12 Z"
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.8)" stroke-width="3"/>
  <rect x="41" y="7" width="18" height="8" rx="2" fill="rgba(255,255,255,0.6)" stroke="rgba(255,255,255,0.8)" stroke-width="2"/>
  <path d="M40,46 C36,54 35,62 38,71" stroke="rgba(255,255,255,0.55)" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;
}

/**
 * 根据道具渲染对应药水瓶（颜色与液面由道具类型决定）
 *  - 小药水：绿色，液面约 35%
 *  - 中药水：蓝色，液面约 65%
 *  - 大药水：金色，满瓶
 */
export function renderPotionIcon(item: Item, size = 56): string {
  const ratio = item.type === 'potion' ? 0.35 : item.type === 'superPotion' ? 0.65 : 1.0;
  return renderFlask(item.color, ratio, size);
}
