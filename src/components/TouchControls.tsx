import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Shield } from 'lucide-react';

interface TouchControlsProps {
  engine: GameEngine | null;
  enabled: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ engine, enabled }) => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const [showButtons, setShowButtons] = useState(true);

  // Global Keyboard & Touch Listeners
  useEffect(() => {
    if (!engine || !enabled) return;

    // Keyboard Controller
    const handleKeyDown = (e: KeyboardEvent) => {
      if (engine.isPaused || engine.isGameOver || !engine.isRunning) return;

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          engine.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          engine.slide();
          break;
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          engine.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          engine.moveRight();
          break;
        case 'KeyE':
        case 'KeyF':
          e.preventDefault();
          engine.activateSkill();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyQ':
          e.preventDefault();
          engine.activateHoverboard();
          break;
      }
    };

    // Touch Swipe Controller
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();

        // Double tap detection
        const now = Date.now();
        if (now - lastTapTime.current < 300) {
          engine.activateHoverboard();
        }
        lastTapTime.current = now;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        const deltaTime = Date.now() - touchStartTime.current;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const minSwipeDist = 30;

        if (deltaTime < 450 && (absX > minSwipeDist || absY > minSwipeDist)) {
          if (absX > absY) {
            // Horizontal swipe
            if (deltaX > 0) {
              engine.moveRight();
            } else {
              engine.moveLeft();
            }
          } else {
            // Vertical swipe
            if (deltaY > 0) {
              engine.slide();
            } else {
              engine.jump();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [engine, enabled]);

  if (!enabled || !engine) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none">
      {/* Optional on-screen direct buttons for touch screen ease */}
      <div className="absolute bottom-20 left-4 flex gap-2 pointer-events-auto">
        <button
          id="btn-move-left"
          onClick={() => engine.moveLeft()}
          className="w-13 h-13 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-cyan-500/40 text-cyan-300 flex items-center justify-center active:scale-90 active:bg-cyan-500/30 transition-transform shadow-lg"
          title="向左闪避"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          id="btn-move-right"
          onClick={() => engine.moveRight()}
          className="w-13 h-13 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-cyan-500/40 text-cyan-300 flex items-center justify-center active:scale-90 active:bg-cyan-500/30 transition-transform shadow-lg"
          title="向右闪避"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute bottom-20 right-4 flex flex-col gap-2 pointer-events-auto">
        <button
          id="btn-action-jump"
          onClick={() => engine.jump()}
          className="w-14 h-14 rounded-2xl bg-cyan-600/70 backdrop-blur-md border border-cyan-300 text-white flex flex-col items-center justify-center active:scale-90 active:bg-cyan-500 transition-transform shadow-xl shadow-cyan-500/30"
          title="跳跃 / 连跳"
        >
          <ArrowUp className="w-6 h-6" />
          <span className="text-[9px] font-black tracking-tighter">JUMP</span>
        </button>
        <button
          id="btn-action-slide"
          onClick={() => engine.slide()}
          className="w-14 h-14 rounded-2xl bg-pink-600/70 backdrop-blur-md border border-pink-300 text-white flex flex-col items-center justify-center active:scale-90 active:bg-pink-500 transition-transform shadow-xl shadow-pink-500/30"
          title="滑行 / 急降"
        >
          <ArrowDown className="w-6 h-6" />
          <span className="text-[9px] font-black tracking-tighter">SLIDE</span>
        </button>
      </div>
    </div>
  );
};
