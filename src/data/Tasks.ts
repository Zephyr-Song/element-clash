/**
 * Tasks.ts - 每日/周常任务模板定义
 * 任务的 metric 决定它在哪个埋点被累加（关卡通关/抽卡/签到/胜利）
 */

export type TaskMetric = 'stage' | 'gacha' | 'checkin' | 'win';

export interface TaskTemplate {
  id: string;
  type: 'daily' | 'weekly';
  name: string;
  description: string;
  metric: TaskMetric;
  target: number;
  rewardCoins: number;
}

/** 每日任务（每天0点刷新） */
export const DAILY_TASKS: TaskTemplate[] = [
  {
    id: 'd_stage',
    type: 'daily',
    name: '日常修行',
    description: '通关 1 个关卡',
    metric: 'stage',
    target: 1,
    rewardCoins: 50,
  },
  {
    id: 'd_gacha',
    type: 'daily',
    name: '召唤祈愿',
    description: '进行 1 次精灵召唤',
    metric: 'gacha',
    target: 1,
    rewardCoins: 50,
  },
  {
    id: 'd_checkin',
    type: 'daily',
    name: '勤勉签到',
    description: '完成 1 次每日签到',
    metric: 'checkin',
    target: 1,
    rewardCoins: 30,
  },
];

/** 周常任务（每周一0点刷新） */
export const WEEKLY_TASKS: TaskTemplate[] = [
  {
    id: 'w_stage',
    type: 'weekly',
    name: '周常挑战',
    description: '累计通关 5 个关卡',
    metric: 'stage',
    target: 5,
    rewardCoins: 200,
  },
  {
    id: 'w_gacha',
    type: 'weekly',
    name: '周常召唤',
    description: '累计召唤 5 次',
    metric: 'gacha',
    target: 5,
    rewardCoins: 200,
  },
  {
    id: 'w_win',
    type: 'weekly',
    name: '常胜将军',
    description: '累计赢得 3 场战斗',
    metric: 'win',
    target: 3,
    rewardCoins: 300,
  },
];
