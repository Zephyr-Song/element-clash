/**
 * GameApp.ts - 根UI组件（场景容器，管理场景切换）
 */

import type { Pet, BattleState, SceneType, Difficulty } from '../data/types';
import { PETS } from '../data/Pets';
import { STAGES, getEnemyPets, getUnlockedPetIds, STARTER_PET_IDS } from '../data/Stages';
import { loadSave, saveSave, updateRecord, isStageCompleted, completeStage, checkIn, getCheckInInfo, GACHA_PET_IDS, canClaimCheckInReward, claimCheckInReward, CHECKIN_REWARD_PET_ID, CHECKIN_REWARD_STREAK, canClaimCheckInReward7, claimCheckInReward7, CHECKIN_REWARD_PET_ID_7, CHECKIN_REWARD_STREAK_7 } from '../utils/Storage';
import { AudioManager } from '../utils/AudioManager';
import { ELEMENT_NAMES, ELEMENT_COLORS, ELEMENT_EMOJIS } from '../data/types';
import { getEffectiveness } from '../data/Elements';
import { MainMenuScene } from './MainMenuScene';
import { PetSelectScene } from './PetSelectScene';
import { BattleScene } from './BattleScene';
import { ResultScene } from './ResultScene';
import { ShareModal } from './ShareModal';
import { GachaScene } from './GachaScene';

export class GameApp {
  private container: HTMLElement;
  private currentScene: HTMLElement | null = null;
  private currentSceneType: SceneType = 'main-menu';

  // 当前选中的宠物和关卡
  private selectedPlayerPets: Pet[] = [];
  private currentStageId: number = 1;
  private lastBattleState: BattleState | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** 启动应用 */
  start(): void {
    const save = loadSave();
    AudioManager.setEnabled(save.soundEnabled);
    this.showMainMenu();
  }

  /** 显示主菜单 */
  showMainMenu(): void {
    this.switchScene(new MainMenuScene(
      () => this.showStageSelect(),
      () => this.showPokedex(),
      () => this.showSettings(),
      () => this.showGuide(),
      () => this.showGacha(),
      () => this.showCheckIn(),
    ), 'main-menu');
  }

  /** 显示关卡选择界面 */
  showStageSelect(): void {
    const save = loadSave();
    const completedSet = new Set(save.completedStages);

    const scene = document.createElement('div');
    scene.className = 'scene stage-select-scene';

    // 标题
    const title = document.createElement('h2');
    title.style.cssText = 'font-size:1.6em;color:#fff;margin-bottom:20px;text-align:center';
    title.textContent = '🗺️ 关卡选择';
    scene.appendChild(title);

    // 关卡列表
    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:12px;max-width:500px;width:100%';

    for (const stage of STAGES) {
      const isCompleted = completedSet.has(stage.id);
      const isUnlocked = stage.id === 1 || completedSet.has(stage.id - 1);

      const card = document.createElement('div');
      card.className = 'stage-card';
      card.style.cssText = `
        display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;
        border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:all .2s;
        background:${isUnlocked ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)'};
        opacity:${isUnlocked ? '1' : '0.4'};
      `;

      // 左侧图标
      const icon = document.createElement('div');
      icon.style.cssText = 'font-size:2.2em;min-width:48px;text-align:center';
      icon.textContent = isUnlocked ? stage.emoji : '🔒';
      card.appendChild(icon);

      // 中间信息
      const info = document.createElement('div');
      info.style.cssText = 'flex:1';

      const nameRow = document.createElement('div');
      nameRow.style.cssText = 'font-weight:700;color:#fff;font-size:1.05em;margin-bottom:4px';
      nameRow.textContent = `第${stage.id}关 · ${stage.name}`;
      if (isCompleted) {
        const check = document.createElement('span');
        check.style.cssText = 'color:#26de81;margin-left:8px';
        check.textContent = '✅';
        nameRow.appendChild(check);
      }
      info.appendChild(nameRow);

      const desc = document.createElement('div');
      desc.style.cssText = 'font-size:.85em;color:rgba(255,255,255,.5);margin-bottom:6px';
      desc.textContent = stage.description;
      info.appendChild(desc);

      // 敌方宠物预览
      const enemyRow = document.createElement('div');
      enemyRow.style.cssText = 'font-size:.9em;display:flex;gap:8px;align-items:center';
      const enemyPets = getEnemyPets(stage.id);
      enemyRow.innerHTML = enemyPets.map(p => `<span>${p.emoji} ${p.name}</span>`).join('');
      info.appendChild(enemyRow);

      // 难度标签
      const diffTag = document.createElement('span');
      const diffColors: Record<string, string> = { easy: '#26de81', medium: '#fed330', hard: '#e84545', insane: '#ff2e93' };
      const diffNames: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难', insane: '极限' };
      diffTag.style.cssText = `font-size:.75em;padding:2px 8px;border-radius:8px;color:${diffColors[stage.difficulty]};border:1px solid ${diffColors[stage.difficulty]}44`;
      diffTag.textContent = diffNames[stage.difficulty];
      info.appendChild(diffTag);

      // 奖励精灵
      const rewardPet = PETS.find(p => p.id === stage.rewardPetId);
      if (rewardPet) {
        const rewardRow = document.createElement('div');
        const rewardUnlocked = isCompleted;
        rewardRow.style.cssText = `font-size:.8em;margin-top:6px;color:${rewardUnlocked ? '#26de81' : 'rgba(255,255,255,.4)'}`;
        rewardRow.textContent = rewardUnlocked
          ? `🎁 奖励: ${rewardPet.emoji} ${rewardPet.name} ✅`
          : `🎁 奖励: ${rewardPet.emoji} ${rewardPet.name}（通关解锁）`;
        info.appendChild(rewardRow);
      }

      card.appendChild(info);

      if (isUnlocked) {
        card.addEventListener('mouseenter', () => {
          card.style.background = 'rgba(255,255,255,.12)';
          card.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.background = 'rgba(255,255,255,.06)';
          card.style.transform = 'translateY(0)';
        });
        card.addEventListener('click', () => {
          AudioManager.playClickSound();
          this.currentStageId = stage.id;
          this.showPetSelect(stage.id);
        });
      }

      list.appendChild(card);
    }

    scene.appendChild(list);

    // 返回按钮
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.style.cssText = 'margin-top:20px;width:100%';
    backBtn.textContent = '🏠 返回主菜单';
    backBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.showMainMenu();
    });
    scene.appendChild(backBtn);

    this.switchSceneRaw(scene, 'stage-select');
  }

  /** 显示选宠界面 */
  showPetSelect(stageId: number): void {
    const enemyPets = getEnemyPets(stageId);
    this.switchScene(new PetSelectScene(
      (pets) => {
        this.selectedPlayerPets = pets;
        this.startBattle(stageId);
      },
      () => this.showStageSelect(),
      enemyPets,
    ), 'pet-select');
  }

  /** 开始对战 */
  private startBattle(stageId: number): void {
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) return;

    const enemyPets = getEnemyPets(stageId);
    const difficulty: Difficulty = stage.difficulty;

    this.switchScene(new BattleScene(
      this.selectedPlayerPets,
      enemyPets,
      difficulty,
      (state) => {
        this.lastBattleState = state;
        this.showResult(state, stageId);
      },
      () => this.showStageSelect(),   // 中途退出 → 返回关卡选择
    ), 'battle');
  }

  /** 显示结果界面 */
  private showResult(state: BattleState, stageId: number): void {
    const isWin = state.stats.winner === 'player';
    const isCompleted = isStageCompleted(stageId);
    const hasNextStage = stageId < STAGES.length;
    const nextStageId = stageId + 1;
    const stageData = STAGES.find(s => s.id === stageId);

    const scene = new ResultScene(
      state,
      () => this.startBattle(stageId),           // 重试本关
      () => this.showStageSelect(),               // 返回关卡选择
      () => this.showShareModal(),
      isWin && !isCompleted,                      // 是否刚通关
      hasNextStage && isWin,                       // 是否有下一关
      hasNextStage && isWin ? () => {              // 下一关回调
        this.currentStageId = nextStageId;
        this.showPetSelect(nextStageId);
      } : undefined,
      isWin && !isCompleted ? stageData?.rewardPetId : undefined,  // 通关奖励精灵ID
    );

    // 更新战绩和关卡进度
    updateRecord(isWin);
    if (isWin) {
      completeStage(stageId);
    }

    this.switchScene(scene, 'result');
  }

  /** 显示分享模态框 */
  private showShareModal(): void {
    if (!this.lastBattleState) return;
    const resultScene = this.currentScene as unknown as { getShareText: () => string };
    if (!resultScene || typeof resultScene.getShareText !== 'function') return;

    const text = resultScene.getShareText();
    const modal = new ShareModal(text, () => {
      this.container.removeChild(modal.el);
    });
    this.container.appendChild(modal.el);
  }

  /** 显示玩法介绍 */
  private showGuide(): void {
    const scene = document.createElement('div');
    scene.className = 'scene guide-scene';
    scene.style.cssText = 'overflow-y:auto;padding:30px 20px';

    // 标题
    const title = document.createElement('h2');
    title.style.cssText = 'font-size:1.6em;color:#fff;margin-bottom:24px;text-align:center';
    title.textContent = '📖 玩法介绍';
    scene.appendChild(title);

    // ============ 游戏概述 ============
    const overview = this.createGuideSection('⚔️ 游戏概述',
      `《元素对决》是一款属性克制回合制卡牌对战游戏。你将带领精灵队伍，挑战6个关卡，逐步解锁新精灵，成为最强训练家！`
    );
    scene.appendChild(overview);

    // ============ 游戏流程 ============
    const flowSteps = [
      { emoji: '🗺️', title: '选择关卡', desc: '从主菜单进入「关卡冒险」，选择已解锁的关卡' },
      { emoji: '🐾', title: '选择精灵', desc: '从已解锁精灵中选3只组成队伍，可预览敌方阵容' },
      { emoji: '⚔️', title: '回合对战', desc: '与敌方精灵轮流释放技能，运用属性克制取得优势' },
      { emoji: '🎉', title: '胜利奖励', desc: '通关可获得新精灵，集齐12只精灵吧！' },
    ];
    const flow = this.createGuideSection('🎮 游戏流程', '');
    const flowList = document.createElement('div');
    flowList.style.cssText = 'display:flex;flex-direction:column;gap:12px';
    for (const step of flowSteps) {
      flowList.innerHTML += `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.06)">
          <span style="font-size:1.8em;min-width:36px;text-align:center">${step.emoji}</span>
          <div>
            <div style="font-weight:700;color:#fff">${step.title}</div>
            <div style="font-size:.85em;color:rgba(255,255,255,.6)">${step.desc}</div>
          </div>
        </div>
      `;
    }
    flow.appendChild(flowList);
    scene.appendChild(flow);

    // ============ 属性克制 ============
    // 收集游戏中实际有宠物的属性
    const petElements = new Set<string>();
    for (const p of PETS) {
      petElements.add(p.element);
      if (p.secondaryElement) petElements.add(p.secondaryElement);
    }
    const petElementArr = [...petElements];

    const typeIntro = this.createGuideSection('🔥💧🌿 属性克制',
      `属性克制是战斗的核心！用克制对方属性的技能攻击，伤害翻倍；被克制则伤害减半。游戏中共有${petElementArr.length}种属性拥有精灵。`
    );
    scene.appendChild(typeIntro);

    // 克制关系表（只展示有宠物的属性之间）
    const typeChart = document.createElement('div');
    typeChart.style.cssText = 'overflow-x:auto;margin-bottom:12px';
    const tableEl = document.createElement('table');
    tableEl.style.cssText = 'width:100%;border-collapse:collapse;font-size:.78em;min-width:400px';
    // 表头
    let headerHtml = '<tr><th style="padding:4px 6px;color:rgba(255,255,255,.4)">攻↓ 防→</th>';
    for (const def of petElementArr) {
      headerHtml += `<th style="padding:4px 6px;color:${ELEMENT_COLORS[def]}">${ELEMENT_EMOJIS[def]}<br>${ELEMENT_NAMES[def]}</th>`;
    }
    headerHtml += '</tr>';
    tableEl.innerHTML = headerHtml;
    // 数据行
    for (const atk of petElementArr) {
      let rowHtml = `<tr><td style="padding:4px 6px;color:${ELEMENT_COLORS[atk]};font-weight:700;text-align:center">${ELEMENT_EMOJIS[atk]}${ELEMENT_NAMES[atk]}</td>`;
      for (const def of petElementArr) {
        const eff = getEffectiveness(atk as any, def as any);
        let bg = 'rgba(255,255,255,.04)';
        let color = 'rgba(255,255,255,.35)';
        let text = '1×';
        if (eff >= 2) { bg = 'rgba(38,222,129,.15)'; color = '#26de81'; text = eff >= 4 ? '4×' : '2×'; }
        else if (eff >= 1.5) { bg = 'rgba(38,222,129,.08)'; color = '#8cd9aa'; text = '1.5×'; }
        else if (eff <= 0) { bg = 'rgba(108,92,231,.15)'; color = '#6c5ce7'; text = '0×'; }
        else if (eff <= 0.25) { bg = 'rgba(108,92,231,.1)'; color = '#a29bfe'; text = '¼×'; }
        else if (eff <= 0.5) { bg = 'rgba(232,69,69,.1)'; color = '#e84545'; text = '½×'; }
        rowHtml += `<td style="padding:4px 6px;text-align:center;background:${bg};color:${color};border-radius:4px;font-weight:600">${text}</td>`;
      }
      rowHtml += '</tr>';
      tableEl.innerHTML += rowHtml;
    }
    typeChart.appendChild(tableEl);
    scene.appendChild(typeChart);

    // 克制关系速览
    const typeLegend = document.createElement('div');
    typeLegend.style.cssText = 'display:flex;gap:12px;justify-content:center;margin-bottom:16px;font-size:.8em';
    typeLegend.innerHTML = `
      <span style="color:#26de81">■ 2× 效果拔群</span>
      <span style="color:#e84545">■ ½× 效果不佳</span>
      <span style="color:#6c5ce7">■ 0× 无效果</span>
    `;
    scene.appendChild(typeLegend);

    // ============ 战斗系统 ============
    const battleMechanics = [
      { emoji: '🎯', title: '选择技能', desc: '每只精灵有4个技能，注意PP（使用次数）和命中率' },
      { emoji: '🔄', title: '切换精灵', desc: '当精灵不利时，可切换后备精灵上场（消耗回合）' },
      { emoji: '⚡', title: '速度决定先手', desc: '速度高的精灵先出手，选择技能后自动按速度排序' },
      { emoji: '💥', title: '暴击', desc: '攻击有概率暴击，造成1.5倍伤害' },
      { emoji: '🔥', title: '异常状态', desc: '技能可附加灼伤、中毒、麻痹、冰冻、睡眠、混乱等状态' },
      { emoji: '📈', title: '能力变化', desc: '某些技能可提升或降低攻防等能力等级（最多±6级）' },
      { emoji: '✨', title: '特性', desc: '每只精灵有独特特性，战斗中自动触发，如"结实"可抵挡一次致命伤害' },
    ];
    const battle = this.createGuideSection('⚔️ 战斗系统', '');
    const battleList = document.createElement('div');
    battleList.style.cssText = 'display:flex;flex-direction:column;gap:10px';
    for (const m of battleMechanics) {
      battleList.innerHTML += `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.04)">
          <span style="font-size:1.4em;min-width:28px;text-align:center">${m.emoji}</span>
          <div>
            <span style="font-weight:700;color:#fff">${m.title}</span>
            <span style="font-size:.85em;color:rgba(255,255,255,.55);margin-left:6px">${m.desc}</span>
          </div>
        </div>
      `;
    }
    battle.appendChild(battleList);
    scene.appendChild(battle);

    // ============ 精灵系统 ============
    const petSection = this.createGuideSection('🐾 精灵系统', '');
    const petInfo = document.createElement('div');
    petInfo.style.cssText = 'display:flex;flex-direction:column;gap:10px';
    petInfo.innerHTML = `
      <div style="padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);font-size:.9em;color:rgba(255,255,255,.7)">
        <div style="font-weight:700;color:#fff;margin-bottom:6px">🎁 初始精灵（6只）</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${STARTER_PET_IDS.map(id => {
            const p = PETS.find(x => x.id === id);
            return p ? `<span style="padding:2px 8px;border-radius:6px;background:${ELEMENT_COLORS[p.element]}22;color:${ELEMENT_COLORS[p.element]};font-size:.9em">${p.emoji} ${p.name}</span>` : '';
          }).join('')}
        </div>
      </div>
      <div style="padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);font-size:.9em;color:rgba(255,255,255,.7)">
        <div style="font-weight:700;color:#fff;margin-bottom:6px">🏆 通关奖励精灵（6只）</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${STAGES.map(s => {
            const p = PETS.find(x => x.id === s.rewardPetId);
            return p ? `<span style="padding:2px 8px;border-radius:6px;background:${ELEMENT_COLORS[p.element]}22;color:${ELEMENT_COLORS[p.element]};font-size:.9em">${p.emoji} ${p.name}（第${s.id}关）</span>` : '';
          }).join('')}
        </div>
      </div>
      <div style="padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);font-size:.9em;color:rgba(255,255,255,.7)">
        <div style="font-weight:700;color:#fff;margin-bottom:6px">📊 六维属性</div>
        每只精灵有6项属性：<span style="color:#e84545">HP</span>（生命值）、<span style="color:#fed330">物攻</span>（物理攻击）、<span style="color:#4facfe">物防</span>（物理防御）、<span style="color:#a55eea">特攻</span>（特殊攻击）、<span style="color:#26de81">特防</span>（特殊防御）、<span style="color:#fd79a8">速度</span>（决定出手顺序）
      </div>
    `;
    petSection.appendChild(petInfo);
    scene.appendChild(petSection);

    // ============ 关卡进度 ============
    const stageSection = this.createGuideSection('🗺️ 关卡进度', '');
    const stageInfo = document.createElement('div');
    stageInfo.style.cssText = 'display:flex;flex-direction:column;gap:8px';
    for (const s of STAGES) {
      const diffNames: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难', insane: '极限' };
      const diffColors: Record<string, string> = { easy: '#26de81', medium: '#fed330', hard: '#e84545', insane: '#ff2e93' };
      const rewardPet = PETS.find(p => p.id === s.rewardPetId);
      stageInfo.innerHTML += `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.04)">
          <span style="font-size:1.6em">${s.emoji}</span>
          <div style="flex:1">
            <span style="font-weight:700;color:#fff">第${s.id}关 · ${s.name}</span>
            <span style="font-size:.75em;margin-left:6px;padding:1px 6px;border-radius:6px;border:1px solid ${diffColors[s.difficulty]}44;color:${diffColors[s.difficulty]}">${diffNames[s.difficulty]}</span>
          </div>
          <span style="font-size:.85em;color:rgba(255,255,255,.5)">${rewardPet ? `🎁 ${rewardPet.emoji} ${rewardPet.name}` : ''}</span>
        </div>
      `;
    }
    stageSection.appendChild(stageInfo);
    scene.appendChild(stageSection);

    // ============ 小贴士 ============
    const tips = this.createGuideSection('💡 小贴士', '');
    const tipsList = document.createElement('div');
    tipsList.style.cssText = 'display:flex;flex-direction:column;gap:8px';
    const tipItems = [
      '属性克制伤害×2，被克制伤害×0.5，合理搭配队伍属性是取胜关键',
      '精灵倒下后必须切换，提前规划后备精灵很重要',
      '异常状态很关键：灼伤持续扣血并降低物攻，麻痹可能无法行动',
      '技能PP有限，注意技能的使用次数',
      '速度决定出手顺序，高速精灵可以先手击杀',
      '通关关卡解锁新精灵，新精灵可能正好克制下一关的敌人',
    ];
    for (const tip of tipItems) {
      tipsList.innerHTML += `
        <div style="padding:6px 12px;border-radius:8px;background:rgba(255,255,255,.04);font-size:.88em;color:rgba(255,255,255,.65)">
          💡 ${tip}
        </div>
      `;
    }
    tips.appendChild(tipsList);
    scene.appendChild(tips);

    // 返回按钮
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.style.cssText = 'margin-top:24px;width:100%';
    backBtn.textContent = '🏠 返回主菜单';
    backBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.showMainMenu();
    });
    scene.appendChild(backBtn);

    this.switchSceneRaw(scene, 'main-menu');
  }

  /** 创建玩法介绍小节 */
  private createGuideSection(title: string, desc: string): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:20px';
    const h3 = document.createElement('h3');
    h3.style.cssText = 'font-size:1.15em;color:#fff;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.1)';
    h3.textContent = title;
    section.appendChild(h3);
    if (desc) {
      const p = document.createElement('p');
      p.style.cssText = 'font-size:.92em;color:rgba(255,255,255,.65);line-height:1.6;margin-bottom:12px';
      p.textContent = desc;
      section.appendChild(p);
    }
    return section;
  }

  /** 显示宠物图鉴 */
  private showPokedex(): void {
    const save = loadSave();
    const unlockedIds = new Set(getUnlockedPetIds(save.completedStages));

    const scene = document.createElement('div');
    scene.className = 'scene';
    scene.style.cssText = 'overflow-y:auto;padding:30px 20px';

    const title = document.createElement('h2');
    title.style.cssText = 'font-size:1.6em;color:#fff;margin-bottom:6px;text-align:center';
    title.textContent = `📖 宠物图鉴（${PETS.length}只精灵）`;
    scene.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size:.85em;color:rgba(255,255,255,.4);margin-bottom:20px;text-align:center';
    subtitle.textContent = `已解锁 ${unlockedIds.size} / ${PETS.length}`;
    scene.appendChild(subtitle);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:600px;width:100%';

    // 稀有度颜色
    const rarityColors: Record<string, string> = { R: '#4facfe', SR: '#a55eea', SSR: '#fed330', UR: '#ff6b6b' };

    const sortedPets = [...PETS].sort((a, b) => {
      const aStarter = STARTER_PET_IDS.includes(a.id) ? 0 : 1;
      const bStarter = STARTER_PET_IDS.includes(b.id) ? 0 : 1;
      return aStarter - bStarter || a.id - b.id;
    });
    for (const pet of sortedPets) {
      const isUnlocked = unlockedIds.has(pet.id);
      const card = document.createElement('div');
      card.style.cssText = `background:${isUnlocked ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.03)'};border:1px solid ${isUnlocked ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)'};border-radius:12px;padding:14px;text-align:center;opacity:${isUnlocked ? '1' : '0.5'}`;
      card.innerHTML = `
        <div style="font-size:2.2em;margin:6px 0;filter:${isUnlocked ? 'none' : 'grayscale(1)'}">${pet.emoji}</div>
        <div style="font-weight:700;color:${isUnlocked ? '#fff' : 'rgba(255,255,255,.4)'};margin-bottom:4px">
          ${pet.name}
          ${!isUnlocked ? ' <span style="font-size:.75em;opacity:.6">🔒</span>' : ''}
        </div>
        ${pet.rarity ? `<div style="font-size:.7em;padding:1px 6px;border-radius:4px;background:${rarityColors[pet.rarity]}22;color:${rarityColors[pet.rarity]};display:inline-block;margin-bottom:4px;opacity:${isUnlocked ? '1' : '0.5'}">${pet.rarity}</div>` : ''}
        <div style="display:flex;gap:4px;justify-content:center;margin-bottom:6px">
          <span style="font-size:.75em;padding:1px 8px;border-radius:6px;background:${ELEMENT_COLORS[pet.element]}${isUnlocked ? '22' : '11'};color:${ELEMENT_COLORS[pet.element]};opacity:${isUnlocked ? '1' : '0.5'}">${ELEMENT_EMOJIS[pet.element]}${ELEMENT_NAMES[pet.element]}</span>
          ${pet.secondaryElement ? `<span style="font-size:.75em;padding:1px 8px;border-radius:6px;background:${ELEMENT_COLORS[pet.secondaryElement]}${isUnlocked ? '22' : '11'};color:${ELEMENT_COLORS[pet.secondaryElement]};opacity:${isUnlocked ? '1' : '0.5'}">${ELEMENT_EMOJIS[pet.secondaryElement]}${ELEMENT_NAMES[pet.secondaryElement]}</span>` : ''}
        </div>
        <div style="font-size:.85em;color:${isUnlocked ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.2)'};margin-bottom:6px">${pet.description}</div>
        ${isUnlocked ? `<div style="font-size:.8em;color:rgba(255,255,255,.4)">
          HP:${pet.baseHp} 攻:${pet.baseAtk} 防:${pet.baseDef}<br>
          魔:${pet.baseSpA} 抗:${pet.baseSpD} 速:${pet.baseSpe}
        </div>` : '<div style="font-size:.75em;color:rgba(255,255,255,.2)">🔒 未获得</div>'}
      `;
      grid.appendChild(card);
    }

    scene.appendChild(grid);

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.style.cssText = 'margin-top:20px';
    backBtn.textContent = '🏠 返回';
    backBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.showMainMenu();
    });
    scene.appendChild(backBtn);

    this.switchSceneRaw(scene, 'main-menu');
  }

  /** 显示设置界面 */
  private showSettings(): void {
    const save = loadSave();

    const scene = document.createElement('div');
    scene.className = 'scene settings-scene';

    scene.innerHTML = `
      <h2>⚙️ 游戏设置</h2>
      <div class="settings-item">
        <label>🔊 音效</label>
        <div class="toggle ${save.soundEnabled ? 'on' : ''}" id="toggle-sound">
          <div class="knob"></div>
        </div>
      </div>
      <div class="settings-item">
        <label>🪙 金币</label>
        <span style="color:#fed330;font-size:.9em">${save.coins}</span>
      </div>
      <div class="settings-item">
        <label>📊 关卡进度</label>
        <span style="color:#fff;font-size:.9em">${save.completedStages.length} / ${STAGES.length} 已通关</span>
      </div>
      <div class="settings-item">
        <label>📖 精灵收集</label>
        <span style="color:#fff;font-size:.9em">${getUnlockedPetIds(save.completedStages).length} / ${PETS.length} 已解锁</span>
      </div>
      <div class="settings-item">
        <label>🎰 抽卡精灵</label>
        <span style="color:#fff;font-size:.9em">${save.gachaPets.filter(id => GACHA_PET_IDS.includes(id)).length} / ${GACHA_PET_IDS.length} 已获得</span>
      </div>
      <div class="settings-item">
        <label>🏆 战绩</label>
        <span style="color:#fff;font-size:.9em">${save.wins}胜 ${save.losses}负</span>
      </div>
      <button class="btn btn-secondary" style="margin-top:30px;width:100%" id="btn-back">🏠 返回主菜单</button>
    `;

    scene.querySelector('#toggle-sound')!.addEventListener('click', () => {
      const toggle = scene.querySelector('#toggle-sound') as HTMLElement;
      const currentSave = loadSave();
      const newVal = !currentSave.soundEnabled;
      AudioManager.setEnabled(newVal);
      saveSave({ ...currentSave, soundEnabled: newVal });
      toggle.classList.toggle('on', newVal);
    });

    scene.querySelector('#btn-back')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.showMainMenu();
    });

    this.switchSceneRaw(scene, 'main-menu');
  }

  /** 显示抽卡场景 */
  private showGacha(): void {
    this.switchScene(new GachaScene(() => this.showMainMenu()), 'gacha');
  }

  /** 显示签到场景 */
  private showCheckIn(): void {
    const save = loadSave();
    const info = getCheckInInfo();
    const scene = document.createElement('div');
    scene.className = 'scene checkin-scene';
    scene.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:30px 20px';

    const title = document.createElement('h2');
    title.style.cssText = 'font-size:1.6em;color:#fff;margin-bottom:8px;text-align:center';
    title.textContent = '📅 每日签到';
    scene.appendChild(title);

    const coinDisplay = document.createElement('div');
    coinDisplay.style.cssText = 'font-size:1.1em;color:#fed330;margin-bottom:20px;text-align:center';
    coinDisplay.innerHTML = `🪙 ${save.coins} 金币`;
    scene.appendChild(coinDisplay);

    // 签到日历
    const calendar = document.createElement('div');
    calendar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:20px;max-width:400px';
    const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
    for (let i = 0; i < 7; i++) {
      const dayBox = document.createElement('div');
      const isCurrentDay = i < info.streak % 7 || (info.streak >= 7 && i < 7);
      const isToday = i === (info.streak % 7) && info.canCheckIn;
      dayBox.style.cssText = `
        width:48px;height:48px;border-radius:10px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        background:${isCurrentDay && !isToday ? 'rgba(38,222,129,.15)' : isToday ? 'rgba(254,211,48,.15)' : 'rgba(255,255,255,.04)'};
        border:2px solid ${isCurrentDay && !isToday ? '#26de81' : isToday ? '#fed330' : 'rgba(255,255,255,.08)'};
      `;
      dayBox.innerHTML = `
        <span style="font-size:.7em;color:rgba(255,255,255,.4)">第${dayLabels[i]}</span>
        <span style="font-size:1.2em">${isCurrentDay && !isToday ? '✅' : isToday ? '📍' : '⬜'}</span>
      `;
      calendar.appendChild(dayBox);
    }
    scene.appendChild(calendar);

    // 连续签到信息
    const streakInfo = document.createElement('div');
    streakInfo.style.cssText = 'font-size:.9em;color:rgba(255,255,255,.5);margin-bottom:16px;text-align:center';
    streakInfo.innerHTML = `🔥 连续签到 <span style="color:#fed330;font-weight:700">${info.streak}</span> 天 · 每日基础 ${100} 金币 + 连续签到 ${50}×天数`;
    scene.appendChild(streakInfo);

    // 7天循环奖励提示
    const bonusInfo = document.createElement('div');
    bonusInfo.style.cssText = 'font-size:.82em;color:rgba(165,94,234,.7);margin-bottom:20px;text-align:center';
    bonusInfo.textContent = '🎁 每7天额外奖励500金币！';
    scene.appendChild(bonusInfo);

    // 签到3天奖励精灵
    const reward3Pet = PETS.find(p => p.id === CHECKIN_REWARD_PET_ID);
    const reward3Claimed = save.checkInRewardCollected;
    const reward3Section = document.createElement('div');
    reward3Section.style.cssText = `margin-bottom:12px;padding:10px 14px;border-radius:12px;text-align:center;border:2px solid ${reward3Claimed ? '#26de81' : '#a55eea'}66;background:${reward3Claimed ? 'rgba(38,222,129,.06)' : 'rgba(165,94,234,.06)'}`;
    reward3Section.innerHTML = `
      <div style="font-size:.75em;color:rgba(255,255,255,.35);margin-bottom:4px">🎀 签到3天 · SR</div>
      <div style="font-size:1.6em">${reward3Claimed ? reward3Pet?.emoji : '🎁'}</div>
      <div style="font-weight:700;color:${reward3Claimed ? '#26de81' : '#fff'};font-size:.85em">${reward3Pet?.name || '???'}</div>
      <div style="font-size:.7em;color:rgba(255,255,255,.35)">${reward3Claimed ? '✅ 已领取' : `${info.streak}/${CHECKIN_REWARD_STREAK} 天`}</div>
    `;
    scene.appendChild(reward3Section);

    // 签到7天奖励精灵
    const reward7Pet = PETS.find(p => p.id === CHECKIN_REWARD_PET_ID_7);
    const reward7Claimed = save.checkInReward7Collected;
    const reward7Section = document.createElement('div');
    reward7Section.style.cssText = `margin-bottom:20px;padding:10px 14px;border-radius:12px;text-align:center;border:2px solid ${reward7Claimed ? '#26de81' : '#fed330'}66;background:${reward7Claimed ? 'rgba(38,222,129,.06)' : 'rgba(254,211,48,.06)'}`;
    reward7Section.innerHTML = `
      <div style="font-size:.75em;color:rgba(255,255,255,.35);margin-bottom:4px">👑 签到7天 · SSR</div>
      <div style="font-size:1.6em">${reward7Claimed ? reward7Pet?.emoji : '🎁'}</div>
      <div style="font-weight:700;color:${reward7Claimed ? '#26de81' : '#fed330'};font-size:.85em">${reward7Pet?.name || '???'}</div>
      <div style="font-size:.7em;color:rgba(255,255,255,.35)">${reward7Claimed ? '✅ 已领取' : `${Math.min(info.streak, CHECKIN_REWARD_STREAK_7)}/${CHECKIN_REWARD_STREAK_7} 天`}</div>
    `;
    scene.appendChild(reward7Section);

    // 签到按钮
    if (info.canCheckIn) {
      const checkInBtn = document.createElement('button');
      checkInBtn.className = 'btn btn-primary';
      checkInBtn.style.cssText = 'width:100%;max-width:300px;font-size:1.1em;margin-bottom:16px';
      checkInBtn.innerHTML = `✅ 领取今日奖励（🪙 +${info.todayReward}）`;
      checkInBtn.addEventListener('click', () => {
        AudioManager.playClickSound();
        const reward = checkIn();
        if (reward > 0) {
          if (canClaimCheckInReward()) claimCheckInReward();
          if (canClaimCheckInReward7()) claimCheckInReward7();
          this.showCheckIn();
        }
      });
      scene.appendChild(checkInBtn);
    } else {
      const doneTag = document.createElement('div');
      doneTag.style.cssText = 'padding:12px 24px;border-radius:10px;background:rgba(38,222,129,.1);color:#26de81;font-size:.95em;margin-bottom:16px;text-align:center';
      doneTag.innerHTML = '✅ 今日已签到，明天再来吧！';
      scene.appendChild(doneTag);
    }

    // 签到规则
    const rules = document.createElement('div');
    rules.style.cssText = 'font-size:.8em;color:rgba(255,255,255,.35);text-align:center;margin-bottom:16px;line-height:1.8;max-width:400px';
    rules.innerHTML = `
      📋 签到规则：<br>
      · 每日基础奖励 100 金币<br>
      · 连续签到每天额外 +50×天数 金币<br>
      · 每7天额外奖励 500 金币<br>
      · 断签后连续天数重置
    `;
    scene.appendChild(rules);

    // 返回按钮
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.style.cssText = 'width:100%;max-width:300px';
    backBtn.textContent = '🏠 返回主菜单';
    backBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.showMainMenu();
    });
    scene.appendChild(backBtn);

    this.switchSceneRaw(scene, 'checkin');
  }

  /** 切换场景（带动画）*/
  private switchScene(newScene: { el: HTMLElement }, type: SceneType): void {
    if (this.currentScene) {
      this.container.removeChild(this.currentScene);
    }
    this.currentScene = newScene.el;
    this.currentSceneType = type;
    this.container.appendChild(newScene.el);
  }

  private switchSceneRaw(el: HTMLElement, type: SceneType): void {
    if (this.currentScene) {
      this.container.removeChild(this.currentScene);
    }
    this.currentScene = el;
    this.currentSceneType = type;
    this.container.appendChild(el);
  }
}
