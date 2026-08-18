import React from 'react';
import { CharacterConfig, PlayerStats } from '../types/game';
import { CHARACTERS } from '../game/CharactersData';
import { X, Check, Lock, Zap, Sparkles, Coins } from 'lucide-react';
import { soundEngine } from '../game/SoundEngine';

interface CharacterShopProps {
  stats: PlayerStats;
  onClose: () => void;
  onSelectCharacter: (id: string) => void;
  onUnlockCharacter: (id: string, cost: number) => void;
}

export const CharacterShop: React.FC<CharacterShopProps> = ({
  stats,
  onClose,
  onSelectCharacter,
  onUnlockCharacter,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              跑客角色与专属技能
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">选择并解锁不同技能特长的跑酷大师</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-2xl border border-amber-500/40">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black text-amber-300 font-mono">
                {stats.coins.toLocaleString()}
              </span>
            </div>

            <button
              id="close-characters-btn"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-5 overflow-y-auto pr-1">
          {CHARACTERS.map((char) => {
            const isUnlocked = stats.characters.includes(char.id) || char.cost === 0;
            const isSelected = stats.selectedCharacterId === char.id;
            const canAfford = stats.coins >= char.cost;

            return (
              <div
                key={char.id}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20'
                    : isUnlocked
                    ? 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                    : 'bg-slate-950/60 border-slate-800 opacity-90'
                }`}
              >
                <div>
                  {/* Top Bar: Title & Avatar Indicator */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                        {char.title}
                      </span>
                      <h3 className="text-lg font-black text-white mt-1">{char.name}</h3>
                    </div>

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
                      style={{
                        backgroundColor: `${char.colorScheme.primary}22`,
                        borderColor: char.colorScheme.primary,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow-md"
                        style={{ backgroundColor: char.colorScheme.glow }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">{char.description}</p>

                  {/* Skills info */}
                  <div className="mt-3.5 space-y-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-start gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <div className="text-[11px]">
                        <span className="font-bold text-purple-300">技能【{char.skillName}】：</span>
                        <span className="text-slate-300">{char.skillDesc}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[11px]">
                        <span className="font-bold text-amber-300">被动：</span>
                        <span className="text-slate-300">{char.passiveBonus}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  {isSelected ? (
                    <button
                      disabled
                      className="w-full py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center gap-1.5 border border-cyan-400/50"
                    >
                      <Check className="w-4 h-4 text-cyan-400" />
                      出战中
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => {
                        soundEngine.playPowerup();
                        onSelectCharacter(char.id);
                      }}
                      className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors shadow-md shadow-cyan-500/20 active:scale-95"
                    >
                      选择出战
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          soundEngine.playPowerup();
                          onUnlockCharacter(char.id, char.cost);
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
                      <span>解锁 ({char.cost.toLocaleString()} 金币)</span>
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
