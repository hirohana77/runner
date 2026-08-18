import React, { useEffect } from 'react';
import { GameRunStats, PlayerStats } from '../types/game';
import {
  RotateCcw,
  Home,
  Trophy,
  Coins,
  Key,
  Footprints,
  Flame,
  Globe,
  Sparkles,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../game/SoundEngine';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  runStats: GameRunStats;
  playerStats: PlayerStats;
  onRevive: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  runStats,
  playerStats,
  onRevive,
  onRetry,
  onHome,
}) => {
  const isNewHighScore = runStats.score >= playerStats.highScore && runStats.score > 0;
  const canReviveWithKey = playerStats.keys >= 1;
  const canReviveWithCoins = playerStats.coins >= 300;

  useEffect(() => {
    if (isNewHighScore) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  }, [isNewHighScore]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow Header */}
        <div className="mb-4">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
            {runStats.deathReason || '跑酷失误撞击'}
          </span>
          <h2 className="text-3xl font-black text-white mt-2 tracking-wide">
            RUN COMPLETE
          </h2>
          {isNewHighScore && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs mt-2 shadow-lg shadow-amber-500/20 animate-bounce">
              <Trophy className="w-4 h-4" /> 创下历史新纪录！
            </div>
          )}
        </div>

        {/* Big Score Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 shadow-inner mb-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">本次跑酷得分</div>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300 font-mono tracking-tight my-1">
            {runStats.score.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>历史最佳: {playerStats.highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 text-left">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
              <Footprints className="w-3 h-3 text-cyan-400" /> 奔跑距离
            </div>
            <div className="text-sm font-black text-slate-100 font-mono mt-0.5">
              {runStats.distance}m
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
              <Coins className="w-3 h-3 text-amber-400" /> 收集金币
            </div>
            <div className="text-sm font-black text-amber-300 font-mono mt-0.5">
              +{runStats.coins}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
              <Zap className="w-3 h-3 text-pink-400" /> 二段连跳
            </div>
            <div className="text-sm font-black text-pink-300 font-mono mt-0.5">
              {runStats.doubleJumps} 次
            </div>
          </div>
        </div>

        {/* Themes Visited Tags */}
        <div className="mb-5 text-left bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2 overflow-x-auto">
          <Globe className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-[11px] font-bold text-slate-400 shrink-0">游历时空:</span>
          <div className="flex gap-1.5 flex-wrap">
            {runStats.themesVisited.map((thm, i) => (
              <span
                key={i}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30"
              >
                {thm}
              </span>
            ))}
          </div>
        </div>

        {/* Revive Action (Save-Me) */}
        <div className="mb-4">
          {canReviveWithKey ? (
            <button
              id="revive-with-key-btn"
              onClick={() => {
                playerStats.keys -= 1;
                soundEngine.playPowerup();
                onRevive();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
            >
              <Key className="w-4 h-4 text-amber-300" />
              <span>钥匙拯救复活 (消耗 1 钥匙，剩余 {playerStats.keys})</span>
            </button>
          ) : canReviveWithCoins ? (
            <button
              id="revive-with-coins-btn"
              onClick={() => {
                playerStats.coins -= 300;
                soundEngine.playPowerup();
                onRevive();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            >
              <Coins className="w-4 h-4 text-slate-950" />
              <span>金币原地复活 (消耗 300 金币)</span>
            </button>
          ) : null}
        </div>

        {/* Bottom Actions: Replay & Home */}
        <div className="flex items-center gap-3">
          <button
            id="gameover-home-btn"
            onClick={onHome}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>主界面</span>
          </button>

          <button
            id="gameover-retry-btn"
            onClick={onRetry}
            className="flex-[2] py-3 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再来一局</span>
          </button>
        </div>
      </div>
    </div>
  );
};
