/**
 * main.ts - 入口：初始化游戏，场景路由
 */

import './styles.css';
import { GameApp } from './ui/GameApp';

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('找不到 #app 容器');
    return;
  }

  // 隐藏加载画面
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 500);
  }

  // 启动游戏
  const game = new GameApp(appContainer);
  game.start();
});
