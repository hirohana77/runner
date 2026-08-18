import * as THREE from 'three';
import {
  ActivePowerup,
  BoardConfig,
  CharacterConfig,
  GameRunStats,
  PlayerAction,
  PlayerStats,
  ThemeConfig,
} from '../types/game';
import { CHARACTERS, BOARDS } from './CharactersData';
import { CharacterRenderer } from './CharacterRenderer';
import { soundEngine } from './SoundEngine';
import { THEMES } from './ThemeManager';
import { LANE_POSITIONS, WorldManager } from './WorldManager';

export class GameEngine {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Sub-systems
  public worldManager: WorldManager;
  public characterRenderer: CharacterRenderer;

  // Game state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public playerStats: PlayerStats;
  public runStats: GameRunStats;

  // Active configs
  public currentCharacter: CharacterConfig;
  public currentBoard: BoardConfig;

  // Player physics state
  private playerLane: number = 0; // -1, 0, 1
  private targetX: number = 0;
  private currentX: number = 0;
  private playerY: number = 0;
  private velocityY: number = 0;
  private playerZ: number = 0;
  private baseSpeed: number = 22;
  private currentSpeed: number = 22;

  // Jump & Double Jump
  private isGrounded: boolean = true;
  private jumpCount: number = 0;
  private maxJumps: number = 2; // Double jump enabled by default!

  // Slide state
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private slideDuration: number = 0.75;

  // Active Skills & Powerups
  public activePowerups: Map<string, ActivePowerup> = new Map();
  public skillCooldownRemaining: number = 0;
  public isSkillActive: boolean = false;
  public skillActiveTimer: number = 0;
  public hasHoverboard: boolean = false;
  public hoverboardTimer: number = 0;
  public isShieldActive: boolean = false;

  // Multipliers & Combos
  public baseMultiplier: number = 1;
  public currentScoreMultiplier: number = 1;
  public currentCombo: number = 0;
  private lastStuntTime: number = 0;

  // Camera Shake & Dynamic FOV
  private cameraShakeIntensity: number = 0;
  private targetFOV: number = 65;

  // Callbacks for React HUD
  public onHUDUpdate?: (engine: GameEngine) => void;
  public onGameOver?: (stats: GameRunStats) => void;
  public onThemeAnnounce?: (theme: ThemeConfig) => void;

  // Animation frame
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  constructor(container: HTMLElement, initialStats: PlayerStats) {
    this.container = container;
    this.playerStats = initialStats;

    this.currentCharacter =
      CHARACTERS.find((c) => c.id === initialStats.selectedCharacterId) || CHARACTERS[0];
    this.currentBoard =
      BOARDS.find((b) => b.id === initialStats.selectedBoardId) || BOARDS[0];

    this.runStats = this.createInitialRunStats();

    // Scene & Renderer
    this.scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 300);
    this.camera.position.set(0, 4.5, 6.5);
    this.camera.lookAt(0, 1.8, -12);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Lights
    this.dirLight = new THREE.DirectionalLight(0x00f0ff, 1.4);
    this.dirLight.position.set(10, 25, 10);
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0x1f244a, 0x121422, 1.0);
    this.scene.add(this.hemiLight);

    // World & Character
    this.worldManager = new WorldManager(this.scene, 'cyberpunk');
    this.worldManager.setEnvironmentLighting(this.dirLight, this.hemiLight);
    this.worldManager.onThemeChanged = (theme) => {
      this.worldManager.setEnvironmentLighting(this.dirLight, this.hemiLight);
      soundEngine.playThemeWarp();
      if (!this.runStats.themesVisited.includes(theme.name)) {
        this.runStats.themesVisited.push(theme.name);
      }
      if (this.onThemeAnnounce) this.onThemeAnnounce(theme);
    };

    this.characterRenderer = new CharacterRenderer(this.currentCharacter, this.currentBoard);
    this.scene.add(this.characterRenderer.group);

    this.applyCharacterPassives();
    this.setupResizeListener();
  }

  private createInitialRunStats(): GameRunStats {
    return {
      score: 0,
      distance: 0,
      coins: 0,
      stunts: 0,
      jumps: 0,
      doubleJumps: 0,
      slides: 0,
      powerupsCollected: 0,
      themesVisited: ['赛博霓虹都市'],
      maxCombo: 1,
      deathReason: '',
    };
  }

  private applyCharacterPassives() {
    this.baseMultiplier = 1;
    if (this.currentCharacter.id === 'mecha_rex') {
      this.baseMultiplier += 5; // Mecha Rex +5x passive
    }
    if (this.currentBoard.id === 'plasma_hover') {
      this.maxJumps = 3; // Triple jump board perk
    } else {
      this.maxJumps = 2;
    }
  }

  public updateCharacterAndBoard(charId: string, boardId: string) {
    this.currentCharacter = CHARACTERS.find((c) => c.id === charId) || this.currentCharacter;
    this.currentBoard = BOARDS.find((b) => b.id === boardId) || this.currentBoard;
    this.characterRenderer.updateConfigs(this.currentCharacter, this.currentBoard);
    this.applyCharacterPassives();
  }

  public start() {
    this.resetRun();
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.lastTime = performance.now();
    soundEngine.startBgm();

    if (this.onThemeAnnounce) {
      this.onThemeAnnounce(this.worldManager.getCurrentTheme());
    }

    this.loop(performance.now());
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public resetRun() {
    this.playerLane = 0;
    this.targetX = 0;
    this.currentX = 0;
    this.playerY = 0;
    this.velocityY = 0;
    this.playerZ = 0;
    this.baseSpeed = 22;
    this.currentSpeed = 22;
    this.isGrounded = true;
    this.jumpCount = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.activePowerups.clear();
    this.skillCooldownRemaining = 0;
    this.isSkillActive = false;
    this.skillActiveTimer = 0;
    this.hasHoverboard = false;
    this.hoverboardTimer = 0;
    this.isShieldActive = false;
    this.currentCombo = 0;

    this.runStats = this.createInitialRunStats();
    this.worldManager.reset('cyberpunk');
    this.worldManager.setEnvironmentLighting(this.dirLight, this.hemiLight);

    this.characterRenderer.group.position.set(0, 0, 0);
  }

  // CONTROLS / INPUT ACTIONS
  public jump() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;

    // Fast cancel slide into jump
    if (this.isSliding) {
      this.isSliding = false;
      this.slideTimer = 0;
    }

    const hasSneakers = this.activePowerups.has('sneakers');
    const jumpVelocity = hasSneakers ? 17.5 : 13.5;

    if (this.isGrounded) {
      // First jump
      this.isGrounded = false;
      this.velocityY = jumpVelocity;
      this.jumpCount = 1;
      this.runStats.jumps++;
      soundEngine.playJump();
      this.addStuntBonus('跳跃腾空 +50');
    } else if (this.jumpCount < this.maxJumps) {
      // Double Jump / Triple Jump (连跳)
      this.velocityY = jumpVelocity * 0.95;
      this.jumpCount++;
      this.runStats.doubleJumps++;
      this.characterRenderer.triggerDoubleJump();
      soundEngine.playDoubleJump();
      this.triggerCameraShake(0.2);
      this.addStuntBonus('空中华丽连跳 +150');
    }
  }

  public slide() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;

    if (!this.isGrounded) {
      // Air fast dive to ground
      this.velocityY = -26;
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      soundEngine.playSlide();
      this.addStuntBonus('空中急速下潜 +80');
      return;
    }

    // Ground slide
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    this.runStats.slides++;
    soundEngine.playSlide();
    this.addStuntBonus('极限滑行 +60');
  }

  public moveLeft() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    if (this.playerLane > -1) {
      this.playerLane--;
      this.targetX = LANE_POSITIONS[this.playerLane + 1];
      soundEngine.playLaneSwitch();
    }
  }

  public moveRight() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    if (this.playerLane < 1) {
      this.playerLane++;
      this.targetX = LANE_POSITIONS[this.playerLane + 1];
      soundEngine.playLaneSwitch();
    }
  }

  public activateHoverboard() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    if (this.hasHoverboard) return; // already active

    this.hasHoverboard = true;
    this.hoverboardTimer = 20; // 20s board duration
    soundEngine.playBoardActivate();
    this.triggerCameraShake(0.35);
  }

  public activateSkill() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    if (this.skillCooldownRemaining > 0 || this.isSkillActive) return;

    this.isSkillActive = true;
    this.skillActiveTimer = 5.0; // 5s skill duration
    this.skillCooldownRemaining = this.currentCharacter.skillCooldown;
    soundEngine.playSkill();
    this.triggerCameraShake(0.5);

    // Apply specific character skill effects
    if (this.currentCharacter.id === 'cyber_ninja') {
      // Phantom Dash: clears all obstacles ahead for 80m!
      this.worldManager.clearAllObstaclesAhead(this.playerZ, 80);
      this.addStuntBonus('瞬影斩空！全图破阵 +500');
    } else if (this.currentCharacter.id === 'street_runner') {
      // Sonic Dash
      this.addStuntBonus('超频狂飙！ +300');
    } else if (this.currentCharacter.id === 'astro_nova') {
      // Anti Gravity flight
      this.velocityY = 15;
      this.worldManager.spawnSkyCoins(this.playerZ);
      this.addStuntBonus('引力悬浮星轨 +400');
    } else if (this.currentCharacter.id === 'shrine_fox') {
      // Fox barrier
      this.isShieldActive = true;
      this.addStuntBonus('灵狐守护结界 +300');
    } else if (this.currentCharacter.id === 'mecha_rex') {
      // Quantum pulse
      this.addStuntBonus('量子磁暴过载！ +600');
    }
  }

  private addStuntBonus(name: string) {
    this.runStats.stunts++;
    this.currentCombo++;
    if (this.currentCombo > this.runStats.maxCombo) {
      this.runStats.maxCombo = this.currentCombo;
    }
    this.lastStuntTime = performance.now();
  }

  private triggerCameraShake(intensity: number) {
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, intensity);
  }

  public revive() {
    this.isGameOver = false;
    this.isRunning = true;
    this.isPaused = false;
    this.hasHoverboard = true;
    this.hoverboardTimer = 10;
    this.worldManager.clearAllObstaclesAhead(this.playerZ, 50);
    this.playerY = 0;
    this.velocityY = 0;
    this.isGrounded = true;
    this.lastTime = performance.now();
    soundEngine.startBgm();
  }

  // MAIN GAME LOOP
  private loop = (time: number) => {
    if (!this.isRunning) return;
    this.animationFrameId = requestAnimationFrame(this.loop);

    if (this.isPaused) {
      this.lastTime = time;
      return;
    }

    const delta = Math.min((time - this.lastTime) / 1000, 0.08); // cap at 80ms to avoid physics tunnelling
    this.lastTime = time;

    this.update(delta);
    this.render();
  };

  private update(delta: number) {
    // Progressive Speed Increase
    this.baseSpeed = Math.min(38, 22 + (this.runStats.distance / 400) * 2.2);
    let speedMult = 1.0;
    if (this.hasHoverboard) speedMult *= this.currentBoard.speedBoost;
    if (this.activePowerups.has('jetpack')) speedMult *= 1.4;
    if (this.isSkillActive && this.currentCharacter.id === 'street_runner') speedMult *= 1.5;
    this.currentSpeed = this.baseSpeed * speedMult;

    // Move forward (negative Z)
    const distanceStep = this.currentSpeed * delta;
    this.playerZ -= distanceStep;
    this.runStats.distance = Math.floor(-this.playerZ);

    // Score Calculation
    let activeScoreMultiplier = this.baseMultiplier;
    if (this.activePowerups.has('multiplier')) activeScoreMultiplier *= 2;
    if (this.isSkillActive && this.currentCharacter.id === 'mecha_rex') activeScoreMultiplier *= 5;
    this.currentScoreMultiplier = activeScoreMultiplier;
    this.runStats.score += Math.floor(distanceStep * 1.5 * activeScoreMultiplier);

    // Combo decay
    if (performance.now() - this.lastStuntTime > 3500 && this.currentCombo > 0) {
      this.currentCombo = Math.max(0, this.currentCombo - 1);
    }

    // Cooldown & Skill Timers
    if (this.skillCooldownRemaining > 0) {
      this.skillCooldownRemaining = Math.max(0, this.skillCooldownRemaining - delta);
    }
    if (this.isSkillActive) {
      this.skillActiveTimer -= delta;
      if (this.skillActiveTimer <= 0) {
        this.isSkillActive = false;
      }
    }

    // Hoverboard Timer
    if (this.hasHoverboard) {
      this.hoverboardTimer -= delta;
      if (this.hoverboardTimer <= 0) {
        this.hasHoverboard = false;
      }
    }

    // Active Powerups Timers
    this.activePowerups.forEach((powerup, key) => {
      powerup.remainingTime -= delta;
      if (powerup.remainingTime <= 0) {
        this.activePowerups.delete(key);
      }
    });

    // Horizontal Lane Movement (Smooth Spring)
    this.currentX = THREE.MathUtils.lerp(this.currentX, this.targetX, delta * 15);

    // Vertical Physics (Gravity & Jump / Jetpack)
    const hasJetpack = this.activePowerups.has('jetpack');
    if (hasJetpack) {
      // Hover high above all obstacles
      this.playerY = THREE.MathUtils.lerp(this.playerY, 7.5, delta * 6);
      this.velocityY = 0;
      this.isGrounded = false;
    } else {
      // Normal gravity physics
      const gravity = 38;
      this.velocityY -= gravity * delta;
      this.playerY += this.velocityY * delta;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.velocityY = 0;
        this.isGrounded = true;
        this.jumpCount = 0;
      }
    }

    // Slide timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Update Character Position in 3D scene
    this.characterRenderer.group.position.set(this.currentX, this.playerY, this.playerZ);

    // Update Character procedural animation
    const tiltX = (this.targetX - this.currentX) / LANE_POSITIONS[2];
    this.characterRenderer.updateAnimation(delta, {
      action: this.isSliding ? 'slide' : !this.isGrounded ? 'jump' : 'run',
      speed: this.currentSpeed,
      isGrounded: this.isGrounded,
      jumpProgress: this.playerY / 3.0,
      isSliding: this.isSliding,
      hasBoard: this.hasHoverboard,
      hasJetpack: hasJetpack,
      hasShield: this.isShieldActive,
      hasSneakers: this.activePowerups.has('sneakers'),
      skillActive: this.isSkillActive,
      tiltX,
    });

    // Update World & Collision Detection
    const hasMagnet =
      this.activePowerups.has('magnet') ||
      (this.isSkillActive && (this.currentCharacter.id === 'mecha_rex' || this.currentCharacter.id === 'street_runner'));
    const magnetRadius = this.currentCharacter.id === 'street_runner' ? 14 : 10;

    const collisionResult = this.worldManager.update(
      delta,
      this.playerZ,
      this.currentX,
      this.playerY,
      this.currentSpeed,
      hasMagnet,
      magnetRadius
    );

    // Coins collected
    if (collisionResult.collectedCoins > 0) {
      let coinMultiplier = 1;
      if (this.hasHoverboard && this.currentBoard.id === 'cyber_gold') coinMultiplier *= 2;
      const totalCoinsGained = collisionResult.collectedCoins * coinMultiplier;
      this.runStats.coins += totalCoinsGained;
      this.playerStats.coins += totalCoinsGained;
      soundEngine.playCoin();
    }

    // Powerup collected
    if (collisionResult.collectedPowerup) {
      this.runStats.powerupsCollected++;
      const pType = collisionResult.collectedPowerup as any;
      const upgradeLevel = (this.playerStats.powerupLevels as any)[pType] || 1;
      let baseDur = 10 + upgradeLevel * 2.5;

      // Character passive bonuses for powerups
      if (pType === 'jetpack' && this.currentCharacter.id === 'astro_nova') baseDur += 4;
      if (this.currentCharacter.id === 'shrine_fox') baseDur *= 1.25;

      this.activePowerups.set(pType, {
        type: pType,
        remainingTime: baseDur,
        maxTime: baseDur,
      });

      soundEngine.playPowerup();
      this.triggerCameraShake(0.3);

      if (pType === 'jetpack') {
        this.worldManager.spawnSkyCoins(this.playerZ);
      }
    }

    // Mystery box collected
    if (collisionResult.collectedMysteryBox) {
      this.playerStats.keys += 1;
      this.playerStats.coins += 200;
      this.runStats.coins += 200;
      soundEngine.playPowerup();
      this.addStuntBonus('神秘宝箱：钥匙+1 & 金币+200');
    }

    // Obstacle Collision Handling
    if (collisionResult.hitObstacle && !this.isGameOver) {
      this.handleCollision(collisionResult.hitObstacle);
    }

    // Update Camera Follow & Shake
    const targetCamZ = this.playerZ + 6.5;
    const targetCamY = Math.max(3.8, this.playerY + 3.8);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, delta * 12);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, delta * 10);
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.currentX * 0.45, delta * 10);

    // Apply Camera Shake
    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity * 0.8;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity * 0.8;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.5);
    }

    // Dynamic FOV for speed sensation
    this.targetFOV = this.currentSpeed > 30 ? 75 : 65;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFOV, delta * 5);
    this.camera.updateProjectionMatrix();

    this.camera.lookAt(this.currentX * 0.2, this.playerY + 1.6, this.playerZ - 12);

    // Notify React HUD
    if (this.onHUDUpdate) {
      this.onHUDUpdate(this);
    }
  }

  private handleCollision(obstacle: any) {
    // If during invulnerable Phantom Dash
    if (this.isSkillActive && this.currentCharacter.id === 'cyber_ninja') {
      return;
    }

    // If Fox Barrier shield is active
    if (this.isShieldActive) {
      this.isShieldActive = false;
      soundEngine.playCrash();
      this.triggerCameraShake(0.6);
      this.worldManager.clearAllObstaclesAhead(this.playerZ, 25);
      return;
    }

    // If Hoverboard is active (absorbs crash!)
    if (this.hasHoverboard) {
      this.hasHoverboard = false;
      this.hoverboardTimer = 0;
      soundEngine.playCrash();
      this.triggerCameraShake(0.7);
      this.worldManager.clearAllObstaclesAhead(this.playerZ, 30);
      return;
    }

    // If Comet board can smash low hurdles
    if (this.hasHoverboard && this.currentBoard.id === 'inferno_comet' && obstacle.type === 'hurdle_low') {
      return;
    }

    // Game Over Crash!
    this.isGameOver = true;
    this.isRunning = false;
    soundEngine.playCrash();
    soundEngine.stopBgm();
    this.triggerCameraShake(1.2);

    this.runStats.deathReason =
      obstacle.type === 'train'
        ? '撞上列车车头'
        : obstacle.type === 'hurdle_low'
        ? '绊倒在路障上'
        : obstacle.type === 'barrier_high'
        ? '撞击高空横梁'
        : '遭遇巡航无人机';

    if (this.runStats.score > this.playerStats.highScore) {
      this.playerStats.highScore = this.runStats.score;
    }
    this.playerStats.totalDistance += this.runStats.distance;

    if (this.onGameOver) {
      this.onGameOver(this.runStats);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private setupResizeListener() {
    const handleResize = () => {
      if (!this.container) return;
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    soundEngine.stopBgm();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
