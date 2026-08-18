import React from 'react';
import { GameEngine } from '../game/GameEngine';
import { ThemeConfig, ActivePowerup } from '../types/game';
import {
  Pause,
  Zap,
  Flame,
  Magnet,
  Rocket,
  Footprints,
  Sparkles,
  Coins,
  Key,
} from 'lucide-react';

interface GameHUDProps {
  engine: GameEngine | null;
  onPause: () => void;
  currentThemeBanner: ThemeConfig | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({ engine, onPause, currentThemeBanner }) => {
  if (!engine) return null;

  const score = engine.runStats.score;
  const distance = engine.runStats.distance;
  const coins = engine.runStats.coins;
  const multiplier = engine.currentScoreMultiplier;
  const combo = engine.currentCombo;
  const skillCd = Math.ceil(engine.skillCooldownRemaining);
  const isSkillActive = engine.isSkillActive;
  const hasBoard = engine.hasHoverboard;
  const boardTime = Math.ceil(engine.hoverboardTimer);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none z-10">
      {/* Top Bar: Stats & Controls */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Score & Distance */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase">得分</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              {score.toLocaleString()}
            </span>
            {multiplier > 1 && (
              <span className="text-xs font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-1.5 py-0.5 rounded-md animate-pulse">
                {multiplier}x
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-300 ml-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Footprints className="w-3.5 h-3.5 text-cyan-400" /> {distance}m
            </span>
            {combo > 1 && (
              <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 animate-bounce">
                <Flame className="w-3 h-3 text-amber-400" /> 连击 x{combo}
              </span>
            )}
          </div>
        </div>

        {/* Center: Active Theme Badge */}
        <div className="hidden md:flex flex-col items-center">
          <div className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-xs font-bold text-slate-200 shadow-md">
            🌐 {engine.worldManager.getCurrentTheme().name}
          </div>
        </div>

        {/* Right: Currency & Pause Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-500/40 shadow-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black text-amber-300 font-mono">{coins}</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-purple-500/40 shadow-md">
            <Key className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-black text-purple-300 font-mono">{engine.playerStats.keys}</span>
          </div>

          <button
            id="pause-game-btn"
            onClick={onPause}
            className="w-10 h-10 rounded-2xl bg-slate-800/90 border border-slate-600 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title="暂停游戏"
          >
            <Pause className="w-5 h-5 text-slate-200" />
          </button>
        </div>
      </div>

      {/* Theme Transition Announcement Banner */}
      {currentThemeBanner && (
        <div className="self-center -mt-12 animate-in fade-in zoom-in-90 duration-500 flex flex-col items-center">
          <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-cyan-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl border-2 border-cyan-300 shadow-2xl shadow-cyan-500/40 text-center">
            <div className="text-xs font-black tracking-widest text-cyan-200 uppercase">
              次元时空穿梭跃迁
            </div>
            <div className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2 justify-center">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              {currentThemeBanner.name}
            </div>
            <div className="text-[10px] text-slate-200 font-mono tracking-widest">
              {currentThemeBanner.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Center-Left: Active Powerup Timers */}
      <div className="flex flex-col gap-2 self-start pointer-events-none">
        {Array.from(engine.activePowerups.values()).map((p: ActivePowerup) => {
          const percent = Math.max(0, (p.remainingTime / p.maxTime) * 100);
          return (
            <div
              key={p.type}
              className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg text-white text-xs font-bold"
            >
              {p.type === 'magnet' && <Magnet className="w-4 h-4 text-rose-400 animate-pulse" />}
              {p.type === 'jetpack' && <Rocket className="w-4 h-4 text-cyan-400 animate-bounce" />}
              {p.type === 'sneakers' && <Footprints className="w-4 h-4 text-amber-400 animate-pulse" />}
              {p.type === 'multiplier' && <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />}
              <span className="capitalize">
                {p.type === 'magnet'
                  ? '磁铁'
                  : p.type === 'jetpack'
                  ? '飞行背包'
                  : p.type === 'sneakers'
                  ? '弹跳鞋'
                  : '双倍金币'}
              </span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-100"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Bar: Action & Skill Quick Buttons */}
      <div className="flex items-end justify-between w-full pointer-events-auto pb-1">
        {/* Hoverboard Status / Activate */}
        <button
          id="hoverboard-skill-btn"
          onClick={() => engine.activateHoverboard()}
          disabled={hasBoard}
          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border transition-all active:scale-95 shadow-xl ${
            hasBoard
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/50'
              : 'bg-slate-900/80 hover:bg-slate-800 border-cyan-500/50 text-white'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/30 flex items-center justify-center border border-cyan-400/60">
            🛹
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              {hasBoard ? `能量滑板 (${boardTime}s)` : '双击/召唤滑板'}
            </div>
            <div className="text-xs font-black text-slate-100">{engine.currentBoard.name}</div>
          </div>
        </button>

        {/* Character Active Skill */}
        <button
          id="character-special-skill-btn"
          onClick={() => engine.activateSkill()}
          disabled={skillCd > 0 || isSkillActive}
          className={`relative flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border transition-all active:scale-95 shadow-xl ${
            isSkillActive
              ? 'bg-purple-600/40 border-purple-400 text-purple-200 ring-4 ring-purple-500/50 animate-pulse'
              : skillCd > 0
              ? 'bg-slate-900/60 border-slate-700 text-slate-400 opacity-80'
              : 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-500 hover:to-pink-500 border-purple-300 text-white shadow-purple-500/30'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/30 flex items-center justify-center border border-purple-300">
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">
              {isSkillActive
                ? '技能爆发中!'
                : skillCd > 0
                ? `冷却中 ${skillCd}s`
                : '专属大招 (Space/E)'}
            </div>
            <div className="text-xs font-black text-white">{engine.currentCharacter.skillName}</div>
          </div>
        </button>
      </div>
    </div>
  );
};
