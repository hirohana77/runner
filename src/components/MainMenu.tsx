import React from 'react';
import { PlayerStats } from '../types/game';
import { CHARACTERS, BOARDS } from '../game/CharactersData';
import {
  Play,
  User,
  Zap,
  Award,
  Sparkles,
  Settings,
  Shield,
  Coins,
  Key,
  Trophy,
  Smartphone,
} from 'lucide-react';

interface MainMenuProps {
  stats: PlayerStats;
  onStartGame: () => void;
  onOpenCharacters: () => void;
  onOpenBoards: () => void;
  onOpenUpgrades: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
  onInstallPWA?: () => void;
  canInstall?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  onStartGame,
  onOpenCharacters,
  onOpenBoards,
  onOpenUpgrades,
  onOpenMissions,
  onOpenSettings,
  onInstallPWA,
  canInstall,
}) => {
  const selectedChar = CHARACTERS.find((c) => c.id === stats.selectedCharacterId) || CHARACTERS[0];
  const selectedBoard = BOARDS.find((b) => b.id === stats.selectedBoardId) || BOARDS[0];
  const unclaimedMissions = stats.missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/90 select-none overflow-y-auto">
      {/* Top Header: Currency & Settings */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        {/* Brand Logo & Highscore */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-300">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300">
              INFINITE SHIFT 3D
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>历史最高分: </span>
              <span className="font-mono text-amber-300 font-bold">{stats.highScore.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Currency & Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-500/40 shadow-lg">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black text-amber-300 font-mono">{stats.coins.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-purple-500/40 shadow-lg">
            <Key className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-black text-purple-300 font-mono">{stats.keys}</span>
          </div>

          <button
            id="settings-btn"
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-2xl bg-slate-800/90 border border-slate-600 hover:bg-slate-700 text-slate-200 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title="设置与说明"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Hero: Character Showcase & Start Run */}
      <div className="flex flex-col items-center justify-center my-auto py-6 max-w-md mx-auto w-full text-center">
        {/* Selected Loadout Pill */}
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyan-500/30 mb-6 shadow-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-slate-400">角色:</span>
            <span className="font-bold text-cyan-300">{selectedChar.name}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-slate-400">滑板:</span>
            <span className="font-bold text-purple-300">{selectedBoard.name}</span>
          </div>
        </div>

        {/* Big Start Button */}
        <button
          id="start-run-btn"
          onClick={onStartGame}
          className="group relative w-64 sm:w-72 py-4 px-8 rounded-3xl bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-500 hover:opacity-95 text-slate-950 font-black text-2xl tracking-wider uppercase shadow-2xl shadow-cyan-500/50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 border-2 border-white/40"
        >
          <Play className="w-8 h-8 fill-slate-950 text-slate-950 group-hover:scale-110 transition-transform" />
          <span>开始极速跑酷</span>
        </button>

        {/* Mobile Install App Button */}
        {onInstallPWA && canInstall && (
          <button
            id="install-pwa-btn"
            onClick={onInstallPWA}
            className="mt-3.5 flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300 font-bold text-xs shadow-lg active:scale-95 transition-all"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>📲 安装到手机主屏幕 (全屏免安装游玩)</span>
          </button>
        )}

        <p className="mt-4 text-xs font-semibold text-slate-400">
          🎮 支持键盘 WASD/方向键/空格，以及手机屏幕触控滑动
        </p>
      </div>

      {/* Bottom Dock: Characters, Boards, Upgrades, Missions */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto w-full">
        {/* Character Shop */}
        <button
          id="open-characters-btn"
          onClick={onOpenCharacters}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800/90 active:scale-95 transition-all shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1 border border-cyan-500/40">
            <User className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">角色与技能</span>
        </button>

        {/* Board Shop */}
        <button
          id="open-boards-btn"
          onClick={onOpenBoards}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-purple-500/30 hover:border-purple-400 hover:bg-slate-800/90 active:scale-95 transition-all shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1 border border-purple-500/40">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">滑板特技</span>
        </button>

        {/* Powerup Upgrades */}
        <button
          id="open-upgrades-btn"
          onClick={onOpenUpgrades}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-amber-500/30 hover:border-amber-400 hover:bg-slate-800/90 active:scale-95 transition-all shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1 border border-amber-500/40">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">道具升级</span>
        </button>

        {/* Missions */}
        <button
          id="open-missions-btn"
          onClick={onOpenMissions}
          className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-pink-500/30 hover:border-pink-400 hover:bg-slate-800/90 active:scale-95 transition-all shadow-lg"
        >
          {unclaimedMissions > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-950 animate-bounce">
              {unclaimedMissions}
            </span>
          )}
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-1 border border-pink-500/40">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">成就任务</span>
        </button>
      </div>
    </div>
  );
};
