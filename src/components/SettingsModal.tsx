import React, { useState } from 'react';
import { X, Volume2, VolumeX, Music, HelpCircle, Sparkles, Globe } from 'lucide-react';
import { soundEngine } from '../game/SoundEngine';
import { THEMES, THEME_LIST } from '../game/ThemeManager';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [sfxVol, setSfxVol] = useState(80);
  const [bgmVol, setBgmVol] = useState(50);

  const handleMuteToggle = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    soundEngine.setSfxVolume(val / 100);
  };

  const handleBgmChange = (val: number) => {
    setBgmVol(val);
    soundEngine.setBgmVolume(val / 100);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-cyan-400" />
              游戏设置与玩法指南
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">音效设置、按键指南与随机主题介绍</p>
          </div>

          <button
            id="close-settings-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 my-5 overflow-y-auto pr-1">
          {/* Audio Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" /> 电子音乐 & 音效
              </span>
              <button
                onClick={handleMuteToggle}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isMuted ? '已静音' : '声音开启'}</span>
              </button>
            </div>

            {/* SFX slider */}
            <div className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-300">
              <span>音效音量</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVol}
                onChange={(e) => handleSfxChange(Number(e.target.value))}
                className="w-40 accent-cyan-400 cursor-pointer"
              />
              <span className="w-8 text-right font-mono text-slate-400">{sfxVol}%</span>
            </div>

            {/* BGM slider */}
            <div className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-300">
              <span>背景音乐</span>
              <input
                type="range"
                min="0"
                max="100"
                value={bgmVol}
                onChange={(e) => handleBgmChange(Number(e.target.value))}
                className="w-40 accent-purple-400 cursor-pointer"
              />
              <span className="w-8 text-right font-mono text-slate-400">{bgmVol}%</span>
            </div>
          </div>

          {/* Controls Guide */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
              🎮 操作指令与按键技巧
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">跳跃 / 连跳：</span>
                <p className="text-slate-400 mt-0.5">向上滑动 / W / ↑ / 空格 (空中再次按下可【二段连跳】翻滚)</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">滑铲 / 急降：</span>
                <p className="text-slate-400 mt-0.5">向下滑动 / S / ↓ (空中滑铲可立即极速俯冲下潜)</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">变道与闪避：</span>
                <p className="text-slate-400 mt-0.5">向左/右滑动 / A / D / ← / → 切换三条跑道</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">滑板与技能：</span>
                <p className="text-slate-400 mt-0.5">双击屏幕或按 Shift / Q 呼出滑板；按 E / Space 释放专属大招</p>
              </div>
            </div>
          </div>

          {/* Random Dimensional Themes Info */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> 随机时空跃迁关卡
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              单局跑酷过程中，穿过【次元跃迁光环】即可无缝切换随机主题世界，享受截然不同的光影、粒子天候与列车障碍设计！
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {THEME_LIST.map((tid) => {
                const t = THEMES[tid];
                return (
                  <span
                    key={tid}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700"
                  >
                    ✨ {t.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
