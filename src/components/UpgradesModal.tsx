import React from 'react';
import { PlayerStats } from '../types/game';
import { X, Zap, Magnet, Rocket, Footprints, Coins, Plus, Check } from 'lucide-react';
import { soundEngine } from '../game/SoundEngine';

interface UpgradesModalProps {
  stats: PlayerStats;
  onClose: () => void;
  onUpgradePowerup: (type: 'magnet' | 'jetpack' | 'sneakers' | 'multiplier', cost: number) => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  stats,
  onClose,
  onUpgradePowerup,
}) => {
  const powerupList = [
    {
      id: 'magnet' as const,
      name: '金币磁铁',
      desc: '强力电磁发生器，吸取周围所有金币。升级增加持续时间与吸力半径。',
      icon: Magnet,
      color: 'text-rose-400',
      bg: 'bg-rose-500/20',
      border: 'border-rose-500/40',
      level: stats.powerupLevels.magnet,
    },
    {
      id: 'jetpack' as const,
      name: '火箭喷气背包',
      desc: '冲上九天云霄，进入专属无障碍高空金币星轨！升级增加持续飞行时间。',
      icon: Rocket,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-500/40',
      level: stats.powerupLevels.jetpack,
    },
    {
      id: 'sneakers' as const,
      name: '弹跳增幅鞋',
      desc: '超级弹性气垫，大幅提升跳跃高度并赋予多次空中翻滚。升级增加持续时间。',
      icon: Footprints,
      color: 'text-amber-400',
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/40',
      level: stats.powerupLevels.sneakers,
    },
    {
      id: 'multiplier' as const,
      name: '2X 得分翻倍',
      desc: '分数计算倍率翻倍，助你轻松刷新历史最高分纪录！升级增加持续时间。',
      icon: Zap,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/40',
      level: stats.powerupLevels.multiplier,
    },
  ];

  const getUpgradeCost = (level: number) => {
    return level * 600 + 400; // 1000, 1600, 2200, 2800...
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              跑酷道具效能强化
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">升级在赛道中拾取的各种核心增益道具持续时间</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-2xl border border-amber-500/40">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black text-amber-300 font-mono">
                {stats.coins.toLocaleString()}
              </span>
            </div>

            <button
              id="close-upgrades-btn"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade list */}
        <div className="space-y-4 my-5 overflow-y-auto pr-1">
          {powerupList.map((p) => {
            const isMax = p.level >= 5;
            const cost = getUpgradeCost(p.level);
            const canAfford = stats.coins >= cost;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-slate-600 transition-all gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl ${p.bg} ${p.border} border flex items-center justify-center shrink-0`}>
                    <p.icon className={`w-6 h-6 ${p.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{p.name}</h3>
                      <span className="text-[10px] font-extrabold bg-slate-950 px-2 py-0.5 rounded-md text-amber-300 border border-slate-700">
                        {isMax ? '已达顶级 MAX' : `等级 ${p.level} / 5`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{p.desc}</p>

                    {/* Progress bars */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-2 w-8 rounded-full transition-all ${
                            lvl <= p.level
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm'
                              : 'bg-slate-700/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isMax ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs flex items-center gap-1 cursor-default"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      已满级
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          soundEngine.playPowerup();
                          onUpgradePowerup(p.id, cost);
                        }
                      }}
                      disabled={!canAfford}
                      className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md ${
                        canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>升级 ({cost.toLocaleString()} 金币)</span>
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
