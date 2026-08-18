export type ThemeType = 'cyberpunk' | 'shinto_sunset' | 'deep_space' | 'subway_tunnels' | 'synthwave_grid';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  subtitle: string;
  skyColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientLight: string;
  dirLightColor: string;
  dirLightIntensity: number;
  groundColor: string;
  trackColor: string;
  railColor: string;
  accentColor: string;
  neonColors: string[];
  billboardAds: string[];
  sceneryType: 'skyscrapers' | 'torii_pagoda' | 'space_dome' | 'subway_pillars' | 'synth_mountains';
  musicTempo: number;
  musicScale: number[];
}

export type PlayerAction =
  | 'run'
  | 'jump'
  | 'double_jump'
  | 'slide'
  | 'dodge_left'
  | 'dodge_right'
  | 'jetpack'
  | 'board'
  | 'stumble'
  | 'crash';

export interface CharacterConfig {
  id: string;
  name: string;
  title: string;
  cost: number;
  unlocked: boolean;
  modelType: 'street_runner' | 'cyber_ninja' | 'astro_nova' | 'shrine_fox' | 'mecha_rex';
  description: string;
  colorScheme: {
    primary: string;
    secondary: string;
    glow: string;
    hair: string;
    skin: string;
  };
  skillName: string;
  skillDesc: string;
  skillCooldown: number; // seconds
  passiveBonus: string;
}

export interface BoardConfig {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  color: string;
  glowColor: string;
  trailColor: string;
  perkDesc: string;
  speedBoost: number; // e.g. 1.2x
}

export type PowerupType = 'magnet' | 'jetpack' | 'sneakers' | 'multiplier' | 'shield';

export interface ActivePowerup {
  type: PowerupType;
  remainingTime: number;
  maxTime: number;
}

export interface PowerupUpgradeInfo {
  level: number;
  baseDuration: number;
  upgradeCost: number;
}

export interface PlayerStats {
  coins: number;
  highScore: number;
  totalDistance: number;
  keys: number;
  selectedCharacterId: string;
  selectedBoardId: string;
  characters: string[]; // unlocked ids
  boards: string[]; // unlocked ids
  powerupLevels: {
    magnet: number;
    jetpack: number;
    sneakers: number;
    multiplier: number;
  };
  missions: Mission[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardCoins: number;
  rewardKeys: number;
  completed: boolean;
  claimed: boolean;
  type: 'coins' | 'distance' | 'jump' | 'slide' | 'double_jump' | 'powerups' | 'score';
}

export interface GameRunStats {
  score: number;
  distance: number;
  coins: number;
  stunts: number;
  jumps: number;
  doubleJumps: number;
  slides: number;
  powerupsCollected: number;
  themesVisited: string[];
  maxCombo: number;
  deathReason: string;
}
