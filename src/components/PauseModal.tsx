import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../game/SoundEngine';

interface PauseModalProps {
  onResume: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRetry, onHome }) => {
  const [isMuted, setIsMuted] = React.useState(soundEngine.getIsMuted());

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col text-center">
        <h2 className="text-2xl font-black text-white mb-1">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mb-6">跑酷已暂停</p>

        <div className="space-y-3">
          <button
            id="pause-resume-btn"
            onClick={onResume}
            className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>继续游戏</span>
          </button>

          <button
            id="pause-retry-btn"
            onClick={onRetry}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新开始</span>
          </button>

          <button
            id="pause-sound-btn"
            onClick={toggleSound}
            className="w-full py-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? '声音：已静音' : '声音：已开启'}</span>
          </button>

          <button
            id="pause-home-btn"
            onClick={onHome}
            className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>退出并返回主菜单</span>
          </button>
        </div>
      </div>
    </div>
  );
};
