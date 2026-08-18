import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { PlayerStats, ThemeConfig, GameRunStats } from './types/game';
import { CHARACTERS, BOARDS, INITIAL_MISSIONS } from './game/CharactersData';
import { GameHUD } from './components/GameHUD';
import { MainMenu } from './components/MainMenu';
import { TouchControls } from './components/TouchControls';
import { CharacterShop } from './components/CharacterShop';
import { BoardShop } from './components/BoardShop';
import { UpgradesModal } from './components/UpgradesModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { soundEngine } from './game/SoundEngine';

const STORAGE_KEY = 'INFINITE_SHIFT_RUNNER_DATA_V1';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Persistent Player Data
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore parse error
      }
    }
    return {
      coins: 500, // starting coins
      highScore: 0,
      totalDistance: 0,
      keys: 2, // starting keys
      selectedCharacterId: 'street_runner',
      selectedBoardId: 'neon_classic',
      characters: ['street_runner'],
      boards: ['neon_classic'],
      powerupLevels: {
        magnet: 1,
        jetpack: 1,
        sneakers: 1,
        multiplier: 1,
      },
      missions: INITIAL_MISSIONS,
    };
  });

  // UI Flow States
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [currentRunStats, setCurrentRunStats] = useState<GameRunStats | null>(null);
  const [themeBanner, setThemeBanner] = useState<ThemeConfig | null>(null);
  const [hudTick, setHudTick] = useState(0);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'none' | 'characters' | 'boards' | 'upgrades' | 'missions' | 'settings'
  >('none');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Save to LocalStorage whenever stats change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  // Initialize Three.js Engine on Mount
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, stats);
    engineRef.current = engine;

    // Callbacks from 3D engine to React state
    engine.onHUDUpdate = () => {
      setHudTick((t) => (t + 1) % 1000);
      // Check mission updates during active run
      updateMissionsProgress(engine.runStats);
    };

    engine.onGameOver = (runStats) => {
      setCurrentRunStats(runStats);
      setGameState('gameover');
      setStats((prev) => ({
        ...prev,
        coins: prev.coins,
        highScore: Math.max(prev.highScore, runStats.score),
        totalDistance: prev.totalDistance + runStats.distance,
      }));
    };

    engine.onThemeAnnounce = (theme) => {
      setThemeBanner(theme);
      setTimeout(() => {
        setThemeBanner(null);
      }, 3500);
    };

    return () => {
      engine.destroy();
    };
  }, []);

  const updateMissionsProgress = (runStats: GameRunStats) => {
    setStats((prev) => {
      let changed = false;
      const updatedMissions = prev.missions.map((m) => {
        let currentProg = m.progress;
        if (m.type === 'jump') currentProg = Math.max(currentProg, runStats.jumps);
        else if (m.type === 'slide') currentProg = Math.max(currentProg, runStats.slides);
        else if (m.type === 'double_jump') currentProg = Math.max(currentProg, runStats.doubleJumps);
        else if (m.type === 'coins') currentProg = Math.max(currentProg, runStats.coins);
        else if (m.type === 'distance') currentProg = Math.max(currentProg, runStats.distance);
        else if (m.type === 'score') currentProg = Math.max(currentProg, runStats.score);

        const isComplete = currentProg >= m.target;
        if (currentProg !== m.progress || isComplete !== m.completed) {
          changed = true;
          return {
            ...m,
            progress: Math.min(m.target, currentProg),
            completed: isComplete,
          };
        }
        return m;
      });

      if (!changed) return prev;
      return { ...prev, missions: updatedMissions };
    });
  };

  // Actions
  const handleStartGame = () => {
    if (!engineRef.current) return;
    setGameState('playing');
    engineRef.current.start();
  };

  const handlePauseGame = () => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setGameState('paused');
  };

  const handleResumeGame = () => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    setGameState('playing');
  };

  const handleRetryGame = () => {
    if (!engineRef.current) return;
    setGameState('playing');
    engineRef.current.start();
  };

  const handleReviveGame = () => {
    if (!engineRef.current) return;
    setGameState('playing');
    engineRef.current.revive();
  };

  const handleReturnHome = () => {
    if (!engineRef.current) return;
    engineRef.current.resetRun();
    soundEngine.stopBgm();
    setGameState('menu');
  };

  const handleSelectCharacter = (id: string) => {
    setStats((prev) => ({ ...prev, selectedCharacterId: id }));
    if (engineRef.current) {
      engineRef.current.updateCharacterAndBoard(id, stats.selectedBoardId);
    }
  };

  const handleUnlockCharacter = (id: string, cost: number) => {
    if (stats.coins < cost) return;
    setStats((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      characters: [...prev.characters, id],
      selectedCharacterId: id,
    }));
    if (engineRef.current) {
      engineRef.current.updateCharacterAndBoard(id, stats.selectedBoardId);
    }
  };

  const handleSelectBoard = (id: string) => {
    setStats((prev) => ({ ...prev, selectedBoardId: id }));
    if (engineRef.current) {
      engineRef.current.updateCharacterAndBoard(stats.selectedCharacterId, id);
    }
  };

  const handleUnlockBoard = (id: string, cost: number) => {
    if (stats.coins < cost) return;
    setStats((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      boards: [...prev.boards, id],
      selectedBoardId: id,
    }));
    if (engineRef.current) {
      engineRef.current.updateCharacterAndBoard(stats.selectedCharacterId, id);
    }
  };

  const handleUpgradePowerup = (type: 'magnet' | 'jetpack' | 'sneakers' | 'multiplier', cost: number) => {
    if (stats.coins < cost) return;
    setStats((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      powerupLevels: {
        ...prev.powerupLevels,
        [type]: prev.powerupLevels[type] + 1,
      },
    }));
  };

  const handleClaimMission = (missionId: string) => {
    setStats((prev) => {
      const mission = prev.missions.find((m) => m.id === missionId);
      if (!mission || mission.claimed) return prev;

      return {
        ...prev,
        coins: prev.coins + mission.rewardCoins,
        keys: prev.keys + mission.rewardKeys,
        missions: prev.missions.map((m) =>
          m.id === missionId ? { ...m, claimed: true } : m
        ),
      };
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Main Menu Layer */}
      {gameState === 'menu' && (
        <MainMenu
          stats={stats}
          onStartGame={handleStartGame}
          onOpenCharacters={() => setActiveModal('characters')}
          onOpenBoards={() => setActiveModal('boards')}
          onOpenUpgrades={() => setActiveModal('upgrades')}
          onOpenMissions={() => setActiveModal('missions')}
          onOpenSettings={() => setActiveModal('settings')}
          onInstallPWA={handleInstallPWA}
          canInstall={!!deferredPrompt}
        />
      )}

      {/* In-Game Active HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <GameHUD
            engine={engineRef.current}
            onPause={handlePauseGame}
            currentThemeBanner={themeBanner}
          />
          <TouchControls engine={engineRef.current} enabled={gameState === 'playing'} />
        </>
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResumeGame}
          onRetry={handleRetryGame}
          onHome={handleReturnHome}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && currentRunStats && (
        <GameOverModal
          runStats={currentRunStats}
          playerStats={stats}
          onRevive={handleReviveGame}
          onRetry={handleRetryGame}
          onHome={handleReturnHome}
        />
      )}

      {/* Overlay Modals */}
      {activeModal === 'characters' && (
        <CharacterShop
          stats={stats}
          onClose={() => setActiveModal('none')}
          onSelectCharacter={handleSelectCharacter}
          onUnlockCharacter={handleUnlockCharacter}
        />
      )}

      {activeModal === 'boards' && (
        <BoardShop
          stats={stats}
          onClose={() => setActiveModal('none')}
          onSelectBoard={handleSelectBoard}
          onUnlockBoard={handleUnlockBoard}
        />
      )}

      {activeModal === 'upgrades' && (
        <UpgradesModal
          stats={stats}
          onClose={() => setActiveModal('none')}
          onUpgradePowerup={handleUpgradePowerup}
        />
      )}

      {activeModal === 'missions' && (
        <MissionsModal
          stats={stats}
          onClose={() => setActiveModal('none')}
          onClaimMission={handleClaimMission}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal onClose={() => setActiveModal('none')} />
      )}
    </div>
  );
}
