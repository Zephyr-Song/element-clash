/**
 * types.ts - 所有TypeScript接口/枚举/类型别名
 * 定义游戏的核心数据结构
 */

// ==================== 属性系统 ====================

/** 14种属性 */
export type Element =
  | 'fire' | 'water' | 'grass' | 'electric'
  | 'ice' | 'dragon' | 'normal' | 'dark'
  | 'rock' | 'flying' | 'poison' | 'steel'
  | 'psychic' | 'ground' | 'bug' | 'fighting';

/** 中文属性名映射 */
export const ELEMENT_NAMES: Record<string, string> = {
  fire: '火', water: '水', grass: '草', electric: '电',
  ice: '冰', dragon: '龙', normal: '普', dark: '恶',
  rock: '岩', flying: '飞', poison: '毒', steel: '钢',
  psychic: '超', ground: '地', bug: '虫', fighting: '格',
};

/** 属性颜色映射 */
export const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ff6b35', water: '#4facfe', grass: '#26de81', electric: '#fed330',
  ice: '#a29bfe', dragon: '#a55eea', normal: '#dfe6e9', dark: '#6c5ce7',
  rock: '#e17055', flying: '#74b9ff', poison: '#00cec9', steel: '#b2bec3',
  psychic: '#fd79a8', ground: '#dda15e', bug: '#ffeaa7', fighting: '#e84545',
};

/** 属性emoji映射 */
export const ELEMENT_EMOJIS: Record<string, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡',
  ice: '❄️', dragon: '🐉', normal: '⭐', dark: '👿',
  rock: '🪨', flying: '🕊️', poison: '☠️', steel: '⚙️',
  psychic: '🔮', ground: '🏜️', bug: '🐛', fighting: '🥊',
};

// ==================== 技能系统 ====================

/** 技能类别 */
export type SkillCategory = 'physical' | 'special' | 'status';

/** 异常状态类型 */
export type StatusCondition = 'poison' | 'burn' | 'paralyze' | 'freeze' | 'sleep' | 'confuse';

/** 技能接口 */
export interface Skill {
  id: number;
  name: string;
  element: Element;
  power: number;
  pp: number;
  maxPp: number;
  accuracy: number;
  category: SkillCategory;
  effect?: string;
  priority: number;
  statChanges?: Partial<StatStages>;
  statusInflict?: StatusCondition;
  /** 附加异常状态的概率(0-1)，默认0.3 */
  statusInflictChance?: number;
  healRatio?: number;
  recoil?: boolean;
  /** 反伤比例(如0.25表示25%反伤)，默认0.33 */
  recoilRatio?: number;
  /** 必中(忽略命中) */
  alwaysHit?: boolean;
  /** 先手技能(无视速度) */
  isContact?: boolean;
  /** 暴击率加成(默认0.0625) */
  critRate?: number;
  /** 蓄力技能 */
  chargeTurn?: boolean;
  /** 强制换宠 */
  forceSwitch?: boolean;
  /** 抽取对方HP的比例(如0.5表示抽50%) */
  drainRatio?: number;
}

// ==================== 宠物系统 ====================

/** 特性ID */
export type TraitId =
  | 'blaze' | 'sturdy' | 'damp' | 'natural_cure'
  | 'static' | 'ice_body' | 'hustle' | 'levitate'
  | 'stench' | 'adaptability' | 'iron_body' | 'shed_skin'
  | 'intimidate' | 'speed_boost' | 'steel_worker' | 'technician'
  | 'unrivaled';

/** 基础六维属性 */
export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spA: number;
  spD: number;
  spe: number;
}

/** 能力等级(强化/弱化阶段，-6到+6) */
export interface StatStages {
  atk: number;
  def: number;
  spA: number;
  spD: number;
  spe: number;
  accuracy: number;
  evasion: number;
}

/** 宠物模板(数据库定义) */
export interface Pet {
  id: number;
  name: string;
  emoji: string;
  element: Element;
  secondaryElement?: Element;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpA: number;
  baseSpD: number;
  baseSpe: number;
  trait: TraitId;
  skills: number[]; // 技能ID数组
  description: string;
  /** 抽卡稀有度（仅抽卡精灵/UR奖励有） */
  rarity?: GachaRarity | 'UR';
}

/** 宠物品质 */
export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

// ==================== 战斗状态 ====================

/** 战斗中宠物的完整运行时状态 */
export interface PetBattleState {
  /** 引用宠物模板 */
  pet: Pet;
  /** 当前HP */
  currentHp: number;
  /** 最大HP(50级计算后的值) */
  maxHp: number;
  /** 能力等级 */
  stages: StatStages;
  /** 当前异常状态 */
  status: StatusCondition | null;
  /** 状态持续回合(计数器) */
  statusTurns: number;
  /** 混乱状态独立回合 */
  confuseTurns: number;
  /** 特性是否已触发(如结实只触发一次) */
  traitTriggered: boolean;
  /** 技能PP剩余 */
  skillPp: number[];
  /** 是否在蓄力中(蓄力技能) */
  isCharging: boolean;
  /** 蓄力的技能ID */
  chargingSkillId: number | null;
  /** 是否存活 */
  isAlive: boolean;
}

/** 道具类型 */
export type ItemType = 'potion' | 'superPotion' | 'fullRestore';

/** 道具定义 */
export interface Item {
  id: number;
  name: string;
  type: ItemType;
  healAmount: number;
  description: string;
}

/** 玩家行动类型 */
export type ActionType = 'move' | 'switch' | 'item';

/** 玩家行动 */
export interface Action {
  type: ActionType;
  /** 技能索引(仅move) */
  skillIndex?: number;
  /** 宠物索引(仅switch) */
  petIndex?: number;
  /** 道具ID(仅item) */
  itemId?: number;
}

/** AI难度 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** 伤害结果 */
export interface DamageResult {
  damage: number;
  effectiveness: number; // 0.25, 0.5, 1, 2, 4
  effectivenessText: string; // '效果拔群!' | '效果不佳...' | '' 等
  isCritical: boolean;
  isMiss: boolean;
  /** 特性加成 */
  traitBoost: boolean;
}

/** 回合事件(用于战斗日志和动画) */
export type BattleEventType =
  | 'move_use'        // 使用技能
  | 'move_hit'        // 技能命中
  | 'damage'          // 造成伤害
  | 'heal'            // 回复HP
  | 'miss'            // 未命中
  | 'critical'        // 暴击
  | 'effectiveness'   // 属性克制
  | 'status_inflict'  // 附加异常
  | 'status_damage'   // 持续伤害
  | 'status_cure'     // 异常解除
  | 'stat_change'     // 能力变化
  | 'faint'           // 宠物倒下
  | 'switch_in'       // 切换上场
  | 'switch_out'      // 切换下场
  | 'item_use'        // 使用道具
  | 'trait_activate'  // 特性发动
  | 'charge'          // 蓄力
  | 'win'             // 获胜
  | 'lose'            // 失败
  | 'recoil'          // 反伤
  | 'drain'           // 吸血
  | 'force_switch';   // 强制换宠

/** 回合事件数据 */
export interface BattleEvent {
  type: BattleEventType;
  /** 事件来源方 'player' | 'enemy' */
  side: 'player' | 'enemy';
  /** 宠物名称 */
  petName: string;
  /** 技能名称(如果有) */
  skillName?: string;
  /** 伤害数值 */
  damage?: number;
  /** 回复数值 */
  healAmount?: number;
  /** 有效性描述 */
  effectivenessText?: string;
  /** 是否暴击 */
  isCritical?: boolean;
  /** 异常状态名 */
  statusName?: string;
  /** 能力变化描述 */
  statChangeText?: string;
  /** 道具名 */
  itemName?: string;
  /** 特性名 */
  traitName?: string;
  /** 新上场的宠物名 */
  newPetName?: string;
  /** 被换下的宠物名 */
  oldPetName?: string;
  /** 回合计数 */
  turn?: number;
}

/** 战斗配置 */
export interface BattleConfig {
  playerParty: Pet[];
  enemyParty: Pet[];
  difficulty: Difficulty;
}

/** 战斗结果统计 */
export interface BattleStats {
  totalTurns: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  highestSingleDamage: number;
  kills: number;
  winner: 'player' | 'enemy';
}

/** 战斗完整状态 */
export interface BattleState {
  playerParty: PetBattleState[];
  enemyParty: PetBattleState[];
  playerActiveIdx: number;
  enemyActiveIdx: number;
  turn: number;
  phase: 'start' | 'player_action' | 'enemy_action' | 'execute' | 'end';
  events: BattleEvent[];
  stats: BattleStats;
  isPlayerTurn: boolean;
}

/** 关卡定义 */
export interface Stage {
  id: number;
  name: string;
  emoji: string;
  description: string;
  enemyPetIds: number[];
  difficulty: Difficulty;
  /** 通关奖励精灵ID */
  rewardPetId: number;
}

/** 场景类型 */
export type SceneType = 'main-menu' | 'stage-select' | 'pet-select' | 'battle' | 'result' | 'gacha' | 'checkin';

/** 抽卡稀有度 */
export type GachaRarity = 'R' | 'SR' | 'SSR';

/** 抽卡结果 */
export interface GachaResult {
  petId: number;
  rarity: GachaRarity;
  isNew: boolean; // 是否新解锁
}

/** 存档数据 */
export interface SaveData {
  wins: number;
  losses: number;
  completedStages: number[];
  soundEnabled: boolean;
  coins: number;
  lastCheckIn: string;   // ISO日期字符串
  checkInStreak: number;  // 连续签到天数
  gachaPets: number[];    // 已通过抽卡获得的精灵ID
  pityCounter: number;    // 保底计数器（SSR保底）
  urRewardCollected: boolean; // 是否已领取通关UR奖励
  checkInRewardCollected: boolean; // 是否已领取签到3天奖励
  checkInReward7Collected: boolean; // 是否已领取签到7天奖励
}
