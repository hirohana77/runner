import React from 'react';
import { BoardConfig, PlayerStats } from '../types/game';
import { BOARDS } from '../game/CharactersData';
import { X, Check, Lock, Shield, Sparkles, Coins, Flame } from 'lucide-react';
import { soundEngine } from '../game/SoundEngine';

interface BoardShopProps {
  stats: PlayerStats;
  onClose: () => void;
  onSelectBoard: (id: string) => void;
  onUnlockBoard: (id: string, cost: number) => void;
}

export const BoardShop: React.FC<BoardShopProps> = ({
  stats,
  onClose,
  onSelectBoard,
  onUnlockBoard,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-purple-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-400" />
              特技能量滑板
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">双击屏幕即可召唤滑板，抵御致命失误并赋予专属特技</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-2xl border border-amber-500/40">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black text-amber-300 font-mono">
                {stats.coins.toLocaleString()}
              </span>
            </div>

            <button
              id="close-boards-btn"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Board Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 overflow-y-auto pr-1">
          {BOARDS.map((board) => {
            const isUnlocked = stats.boards.includes(board.id) || board.cost === 0;
            const isSelected = stats.selectedBoardId === board.id;
            const canAfford = stats.coins >= board.cost;

            return (
              <div
                key={board.id}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/20'
                    : isUnlocked
                    ? 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                    : 'bg-slate-950/60 border-slate-800 opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">{board.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                          速度加成 +{Math.round((board.speedBoost - 1) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div
                      className="w-12 h-6 rounded-lg flex items-center justify-center border shadow-inner"
                      style={{
                        backgroundColor: `${board.color}33`,
                        borderColor: board.glowColor,
                      }}
                    >
                      <div
                        className="w-8 h-2 rounded-full"
                        style={{ backgroundColor: board.trailColor }}
                      />
                    </div>
                  </div>

                  {/* Perk Description */}
                  <div className="mt-3.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300">{board.perkDesc}</p>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  {isSelected ? (
                    <button
                      disabled
                      className="w-full py-2 rounded-xl bg-purple-500/20 text-purple-300 font-black text-xs flex items-center justify-center gap-1.5 border border-purple-400/50"
                    >
                      <Check className="w-4 h-4 text-purple-400" />
                      已装备
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => {
                        soundEngine.playBoardActivate();
                        onSelectBoard(board.id);
                      }}
                      className="w-full py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs transition-colors shadow-md shadow-purple-500/20 active:scale-95"
                    >
                      装备此滑板
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          soundEngine.playPowerup();
                          onUnlockBoard(board.id, board.cost);
                        }
                      }}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                        canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>解锁 ({board.cost.toLocaleString()} 金币)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
