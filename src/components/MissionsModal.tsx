import React from 'react';
import { Mission, PlayerStats } from '../types/game';
import { X, Award, Check, Coins, Key, Gift } from 'lucide-react';
import { soundEngine } from '../game/SoundEngine';
import confetti from 'canvas-confetti';

interface MissionsModalProps {
  stats: PlayerStats;
  onClose: () => void;
  onClaimMission: (missionId: string) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  stats,
  onClose,
  onClaimMission,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-pink-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-pink-400" />
              跑酷成就与悬赏任务
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">完成挑战领取海量金币与珍贵复活钥匙</p>
          </div>

          <button
            id="close-missions-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Missions List */}
        <div className="space-y-3.5 my-5 overflow-y-auto pr-1">
          {stats.missions.map((m) => {
            const percent = Math.min(100, Math.round((m.progress / m.target) * 100));

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  m.claimed
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : m.completed
                    ? 'bg-pink-950/30 border-pink-500/50 shadow-lg shadow-pink-500/10 ring-1 ring-pink-400/40'
                    : 'bg-slate-800/60 border-slate-700'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{m.title}</h3>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="flex items-center gap-0.5 text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                        <Coins className="w-3.5 h-3.5" /> +{m.rewardCoins}
                      </span>
                      {m.rewardKeys > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/30">
                          <Key className="w-3.5 h-3.5" /> +{m.rewardKeys}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{m.description}</p>

                  {/* Progress bar */}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {m.progress} / {m.target} ({percent}%)
                    </span>
                  </div>
                </div>

                {/* Claim / Status */}
                <div className="shrink-0">
                  {m.claimed ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs flex items-center gap-1 cursor-default"
                    >
                      <Check className="w-4 h-4 text-slate-500" />
                      已领取
                    </button>
                  ) : m.completed ? (
                    <button
                      onClick={() => {
                        soundEngine.playPowerup();
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                        onClaimMission(m.id);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-400 hover:opacity-90 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-pink-500/30 animate-pulse active:scale-95 transition-transform"
                    >
                      <Gift className="w-4 h-4" />
                      领取奖励
                    </button>
                  ) : (
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-slate-500 font-bold text-xs border border-slate-800">
                      进行中
                    </div>
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
