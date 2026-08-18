import * as THREE from 'three';
import { ThemeConfig, ThemeType } from '../types/game';
import { THEMES, getRandomTheme } from './ThemeManager';
import { ObstacleFactory, GameObject, ObstacleType } from './ObstacleFactory';

export const LANE_WIDTH = 3.0;
export const LANE_POSITIONS = [-LANE_WIDTH, 0, LANE_WIDTH];

export class WorldManager {
  public scene: THREE.Scene;
  public currentTheme: ThemeConfig;
  public targetTheme: ThemeConfig;
  private obstacleFactory: ObstacleFactory;

  // Track and Scenery
  private trackSegments: THREE.Group[] = [];
  private sceneryObjects: THREE.Group[] = [];
  private gameObjects: GameObject[] = [];
  private particleSystem: THREE.Points | null = null;

  // Spawning cursors
  private nextSpawnZ: number = -20;
  private segmentLength: number = 30;
  private distanceTraveled: number = 0;
  private nextThemeShiftDistance: number = 500;

  // Callbacks
  public onThemeChanged?: (theme: ThemeConfig) => void;

  constructor(scene: THREE.Scene, initialThemeType: ThemeType = 'cyberpunk') {
    this.scene = scene;
    this.currentTheme = THEMES[initialThemeType];
    this.targetTheme = this.currentTheme;
    this.obstacleFactory = new ObstacleFactory();

    this.createAtmosphericParticles();
    this.initInitialWorld();
  }

  public getCurrentTheme(): ThemeConfig {
    return this.currentTheme;
  }

  private createAtmosphericParticles() {
    const count = 350;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 25 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(this.currentTheme.accentColor),
      size: 0.25,
      transparent: true,
      opacity: 0.65,
    });
    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  }

  private initInitialWorld() {
    // Generate empty safe runway for first 60m
    for (let i = 0; i < 4; i++) {
      this.spawnTrackSegment(false);
    }
    // Generate challenging segments ahead
    for (let i = 0; i < 6; i++) {
      this.spawnTrackSegment(true);
    }
  }

  public setEnvironmentLighting(dirLight: THREE.DirectionalLight, hemiLight: THREE.HemisphereLight) {
    dirLight.color.set(this.currentTheme.dirLightColor);
    dirLight.intensity = this.currentTheme.dirLightIntensity;
    hemiLight.color.set(this.currentTheme.ambientLight);
    hemiLight.groundColor.set(this.currentTheme.groundColor);
    this.scene.fog = new THREE.Fog(
      new THREE.Color(this.currentTheme.fogColor),
      this.currentTheme.fogNear,
      this.currentTheme.fogFar
    );
    this.scene.background = new THREE.Color(this.currentTheme.skyColor);

    if (this.particleSystem) {
      (this.particleSystem.material as THREE.PointsMaterial).color.set(this.currentTheme.accentColor);
    }
  }

  private spawnTrackSegment(spawnObstacles: boolean) {
    const segGroup = new THREE.Group();
    segGroup.position.z = this.nextSpawnZ;

    const trackColor = new THREE.Color(this.currentTheme.trackColor);
    const railColor = new THREE.Color(this.currentTheme.railColor);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(12, this.segmentLength);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({ color: trackColor, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0;
    segGroup.add(ground);

    // 3 Track Rails & Neon separators
    const railGeo = new THREE.BoxGeometry(0.1, 0.08, this.segmentLength);
    const railMat = new THREE.MeshBasicMaterial({ color: railColor });

    for (let i = 0; i < 4; i++) {
      const x = -4.5 + i * 3.0;
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, 0.04, 0);
      segGroup.add(rail);
    }

    // Side Scenery Props
    this.spawnSideScenery(segGroup);

    this.scene.add(segGroup);
    this.trackSegments.push(segGroup);

    if (spawnObstacles) {
      this.generateSegmentObstacles(this.nextSpawnZ);
    }

    this.nextSpawnZ -= this.segmentLength;
  }

  private spawnSideScenery(parent: THREE.Group) {
    const theme = this.currentTheme;

    // Left and Right side scenery
    [-1, 1].forEach((side) => {
      const sceneryGroup = new THREE.Group();
      const xOffset = side * (8.0 + Math.random() * 4.0);

      if (theme.sceneryType === 'skyscrapers') {
        // Cyberpunk Skyscraper block
        const width = 6 + Math.random() * 4;
        const height = 20 + Math.random() * 35;
        const depth = 12 + Math.random() * 8;
        const bldgGeo = new THREE.BoxGeometry(width, height, depth);
        const bldgMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x0c0f1d),
          roughness: 0.4,
          metalness: 0.8,
        });
        const bldg = new THREE.Mesh(bldgGeo, bldgMat);
        bldg.position.set(0, height / 2, 0);
        sceneryGroup.add(bldg);

        // Neon Billboard on building
        const bbGeo = new THREE.PlaneGeometry(width * 0.7, 4);
        if (side < 0) bbGeo.rotateY(Math.PI / 2);
        else bbGeo.rotateY(-Math.PI / 2);
        const bbMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(theme.neonColors[Math.floor(Math.random() * theme.neonColors.length)]),
        });
        const bb = new THREE.Mesh(bbGeo, bbMat);
        bb.position.set(side > 0 ? -width / 2 - 0.1 : width / 2 + 0.1, 12 + Math.random() * 10, 0);
        sceneryGroup.add(bb);
      } else if (theme.sceneryType === 'torii_pagoda') {
        // Torii gate / Pagoda tower
        const h = 18 + Math.random() * 15;
        const towerGeo = new THREE.CylinderGeometry(2, 4.5, h, 6);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x3d1822, roughness: 0.7 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(0, h / 2, 0);
        sceneryGroup.add(tower);

        // Glowing lantern
        const lanGeo = new THREE.SphereGeometry(0.8, 12, 12);
        const lanMat = new THREE.MeshBasicMaterial({ color: 0xff3322 });
        const lan = new THREE.Mesh(lanGeo, lanMat);
        lan.position.set(0, 4, 0);
        sceneryGroup.add(lan);
      } else if (theme.sceneryType === 'space_dome') {
        // Floating asteroid / Space Dome ring
        const domeGeo = new THREE.DodecahedronGeometry(5 + Math.random() * 4);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0x221a38, roughness: 0.3, metalness: 0.9 });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(0, 10 + Math.random() * 10, 0);
        sceneryGroup.add(dome);
      } else if (theme.sceneryType === 'subway_pillars') {
        // Heavy steel arch pillar
        const colGeo = new THREE.CylinderGeometry(0.6, 0.6, 12, 8);
        const colMat = new THREE.MeshStandardMaterial({ color: 0x2b3340, metalness: 0.8 });
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(0, 6, 0);
        sceneryGroup.add(col);
      } else {
        // Synthwave mountain pyramids
        const pyrGeo = new THREE.ConeGeometry(8, 24, 4);
        const pyrMat = new THREE.MeshStandardMaterial({ color: 0x35004a, wireframe: true });
        const pyr = new THREE.Mesh(pyrGeo, pyrMat);
        pyr.position.set(0, 12, 0);
        sceneryGroup.add(pyr);
      }

      sceneryGroup.position.set(xOffset, 0, (Math.random() - 0.5) * (this.segmentLength * 0.6));
      parent.add(sceneryGroup);
    });
  }

  private generateSegmentObstacles(segZ: number) {
    // Check if we should spawn a dimensional warp portal for theme transition
    if (this.distanceTraveled >= this.nextThemeShiftDistance) {
      this.targetTheme = getRandomTheme(this.currentTheme.id);
      this.nextThemeShiftDistance += 600;

      const portalMesh = this.obstacleFactory.createWarpPortal(this.currentTheme, this.targetTheme);
      portalMesh.position.set(0, 0, segZ);
      this.scene.add(portalMesh);

      this.gameObjects.push({
        mesh: portalMesh,
        type: 'warp_portal',
        lane: 0,
        z: segZ,
        y: 0,
        width: 8,
        height: 7,
        depth: 3,
        active: true,
      });
      return;
    }

    // Pattern Selection:
    // 0: Hurdle / High barrier gauntlet
    // 1: Train in one lane with Ramp in front
    // 2: Double trains with one clear escape lane
    // 3: Moving Drone & coin arc
    // 4: Powerup pickup with hurdle challenge
    const pattern = Math.floor(Math.random() * 5);
    const lanes = [-1, 0, 1];

    if (pattern === 0) {
      // Hurdle / Barrier combo across lanes
      lanes.forEach((lane) => {
        const isHurdle = Math.random() > 0.45;
        const zPos = segZ + (Math.random() - 0.5) * 12;
        const xPos = LANE_POSITIONS[lane + 1];

        const mesh = isHurdle
          ? this.obstacleFactory.createLowHurdle(this.currentTheme)
          : this.obstacleFactory.createHighBarrier(this.currentTheme);

        mesh.position.set(xPos, 0, zPos);
        this.scene.add(mesh);

        this.gameObjects.push({
          mesh,
          type: isHurdle ? 'hurdle_low' : 'barrier_high',
          lane,
          z: zPos,
          y: 0,
          width: 2.2,
          height: isHurdle ? 1.0 : 3.5,
          depth: 0.8,
          active: true,
        });

        // Spawn coin arc over low hurdles
        if (isHurdle && Math.random() > 0.3) {
          this.spawnCoinArc(lane, zPos - 4, zPos + 4, 1.8);
        }
      });
    } else if (pattern === 1) {
      // Train + Ramp in chosen lane
      const trainLane = lanes[Math.floor(Math.random() * lanes.length)];
      const trainX = LANE_POSITIONS[trainLane + 1];
      const trainZ = segZ - 4;

      // Ramp in front of train
      const rampMesh = this.obstacleFactory.createRamp(this.currentTheme);
      rampMesh.position.set(trainX, 0, trainZ + 12);
      this.scene.add(rampMesh);

      this.gameObjects.push({
        mesh: rampMesh,
        type: 'ramp',
        lane: trainLane,
        z: trainZ + 12,
        y: 0,
        width: 2.2,
        height: 2.8,
        depth: 5.5,
        active: true,
      });

      // Train
      const trainMesh = this.obstacleFactory.createTrain(this.currentTheme, 20);
      trainMesh.position.set(trainX, 0, trainZ);
      this.scene.add(trainMesh);

      this.gameObjects.push({
        mesh: trainMesh,
        type: 'train',
        lane: trainLane,
        z: trainZ,
        y: 0,
        width: 2.4,
        height: 2.8,
        depth: 20,
        active: true,
      });

      // Coins on train roof!
      for (let dz = -7; dz <= 7; dz += 3.5) {
        this.spawnCoin(trainLane, trainZ + dz, 3.8);
      }

      // Fill other lanes with some coins or hurdles
      const otherLanes = lanes.filter((l) => l !== trainLane);
      otherLanes.forEach((ol) => {
        if (Math.random() > 0.4) {
          this.spawnCoinLine(ol, segZ - 10, segZ + 10, 0.8);
        }
      });
    } else if (pattern === 2) {
      // Double trains with one escape lane
      const safeLane = lanes[Math.floor(Math.random() * lanes.length)];
      const trainLanes = lanes.filter((l) => l !== safeLane);

      trainLanes.forEach((tl) => {
        const trainX = LANE_POSITIONS[tl + 1];
        const trainZ = segZ;
        const trainMesh = this.obstacleFactory.createTrain(this.currentTheme, 16);
        trainMesh.position.set(trainX, 0, trainZ);
        this.scene.add(trainMesh);

        this.gameObjects.push({
          mesh: trainMesh,
          type: 'train',
          lane: tl,
          z: trainZ,
          y: 0,
          width: 2.4,
          height: 2.8,
          depth: 16,
          active: true,
        });
      });

      // Reward in safe lane
      this.spawnCoinLine(safeLane, segZ - 8, segZ + 8, 0.8);
    } else if (pattern === 3) {
      // Drone hazard + Mystery box
      const droneLane = lanes[Math.floor(Math.random() * lanes.length)];
      const droneMesh = this.obstacleFactory.createDrone(this.currentTheme);
      droneMesh.position.set(LANE_POSITIONS[droneLane + 1], 1.6, segZ);
      this.scene.add(droneMesh);

      this.gameObjects.push({
        mesh: droneMesh,
        type: 'drone',
        lane: droneLane,
        z: segZ,
        y: 1.6,
        width: 1.8,
        height: 1.8,
        depth: 1.8,
        isMoving: true,
        moveSpeed: 3.5,
        active: true,
      });

      // Mystery Box in adjacent lane
      const mbLane = lanes[(droneLane + 2) % 3];
      const boxMesh = this.obstacleFactory.createMysteryBox();
      boxMesh.position.set(LANE_POSITIONS[mbLane + 1], 1.2, segZ);
      this.scene.add(boxMesh);

      this.gameObjects.push({
        mesh: boxMesh,
        type: 'mystery_box',
        lane: mbLane,
        z: segZ,
        y: 1.2,
        width: 1.2,
        height: 1.2,
        depth: 1.2,
        active: true,
      });
    } else {
      // Powerup spawn
      const pTypes: Array<'magnet' | 'jetpack' | 'sneakers' | 'multiplier'> = [
        'magnet',
        'jetpack',
        'sneakers',
        'multiplier',
      ];
      const chosenType = pTypes[Math.floor(Math.random() * pTypes.length)];
      const pLane = lanes[Math.floor(Math.random() * lanes.length)];

      const pMesh = this.obstacleFactory.createPowerup(chosenType);
      pMesh.position.set(LANE_POSITIONS[pLane + 1], 1.3, segZ);
      this.scene.add(pMesh);

      this.gameObjects.push({
        mesh: pMesh,
        type: `powerup_${chosenType}` as ObstacleType,
        lane: pLane,
        z: segZ,
        y: 1.3,
        width: 1.4,
        height: 1.4,
        depth: 1.4,
        active: true,
      });

      // Coin trail around it
      this.spawnCoinLine(pLane, segZ - 10, segZ - 2, 0.8);
    }
  }

  public spawnCoin(lane: number, z: number, y: number = 0.8) {
    const mesh = this.obstacleFactory.createCoin();
    mesh.position.set(LANE_POSITIONS[lane + 1], y, z);
    this.scene.add(mesh);

    this.gameObjects.push({
      mesh,
      type: 'coin',
      lane,
      z,
      y,
      width: 1.0,
      height: 1.0,
      depth: 1.0,
      active: true,
    });
  }

  public spawnCoinLine(lane: number, startZ: number, endZ: number, y: number = 0.8) {
    const step = 2.5;
    for (let z = Math.min(startZ, endZ); z <= Math.max(startZ, endZ); z += step) {
      this.spawnCoin(lane, z, y);
    }
  }

  public spawnCoinArc(lane: number, startZ: number, endZ: number, peakHeight: number = 2.2) {
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const z = THREE.MathUtils.lerp(startZ, endZ, t);
      const y = 0.8 + Math.sin(t * Math.PI) * peakHeight;
      this.spawnCoin(lane, z, y);
    }
  }

  public spawnSkyCoins(currentZ: number) {
    // For Jetpack flight path
    for (let i = 1; i <= 25; i++) {
      const z = currentZ - i * 3.5;
      const lane = Math.sin(i * 0.4) > 0.3 ? 1 : Math.sin(i * 0.4) < -0.3 ? -1 : 0;
      this.spawnCoin(lane, z, 7.5);
    }
  }

  public update(
    delta: number,
    playerZ: number,
    playerX: number,
    playerY: number,
    speed: number,
    hasMagnet: boolean,
    magnetRadius: number = 10
  ): {
    collectedCoins: number;
    collectedPowerup?: string;
    collectedMysteryBox: boolean;
    hitObstacle?: GameObject;
    passedPortal?: boolean;
  } {
    this.distanceTraveled = -playerZ;

    let collectedCoins = 0;
    let collectedPowerup: string | undefined = undefined;
    let collectedMysteryBox = false;
    let hitObstacle: GameObject | undefined = undefined;
    let passedPortal = false;

    // Move dynamic atmospheric particles
    if (this.particleSystem) {
      this.particleSystem.position.z = playerZ - 30;
      this.particleSystem.rotation.y += delta * 0.05;
    }

    // Spawn new segments as player advances
    if (playerZ - this.nextSpawnZ < 150) {
      this.spawnTrackSegment(true);
    }

    // Recycle track segments behind player
    while (this.trackSegments.length > 0 && this.trackSegments[0].position.z > playerZ + 40) {
      const oldSeg = this.trackSegments.shift()!;
      this.scene.remove(oldSeg);
    }

    // Update Game Objects (Collision, Magnet pull, Spin, Cleanup)
    for (let i = this.gameObjects.length - 1; i >= 0; i--) {
      const obj = this.gameObjects[i];
      if (!obj.active) {
        this.gameObjects.splice(i, 1);
        continue;
      }

      // Rotate coins and powerups
      if (obj.type === 'coin' || obj.type.startsWith('powerup_') || obj.type === 'mystery_box') {
        obj.mesh.rotation.y += delta * 4;
      }

      // Moving drones
      if (obj.type === 'drone' && obj.isMoving) {
        obj.mesh.position.x += Math.sin(Date.now() * 0.003) * delta * (obj.moveSpeed || 3);
      }

      // Magnet pull logic for coins
      if (hasMagnet && obj.type === 'coin' && !obj.collected) {
        const dx = playerX - obj.mesh.position.x;
        const dy = (playerY + 1.0) - obj.mesh.position.y;
        const dz = playerZ - obj.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < magnetRadius) {
          obj.mesh.position.x += (dx / dist) * delta * 25;
          obj.mesh.position.y += (dy / dist) * delta * 25;
          obj.mesh.position.z += (dz / dist) * delta * 25;
        }
      }

      // Collision Check
      const objX = obj.mesh.position.x;
      const objY = obj.mesh.position.y;
      const objZ = obj.mesh.position.z;

      const dz = Math.abs(playerZ - objZ);
      const dx = Math.abs(playerX - objX);
      const dy = playerY - objY;

      // Warp portal collision
      if (obj.type === 'warp_portal') {
        if (dz < 2.0 && dx < 4.0) {
          this.currentTheme = this.targetTheme;
          passedPortal = true;
          this.scene.remove(obj.mesh);
          obj.active = false;
          this.gameObjects.splice(i, 1);
          if (this.onThemeChanged) this.onThemeChanged(this.currentTheme);
          continue;
        }
      }

      // Collectible collision
      if (obj.type === 'coin' && !obj.collected) {
        if (dz < 1.4 && dx < 1.2 && Math.abs(dy) < 1.8) {
          obj.collected = true;
          obj.active = false;
          collectedCoins++;
          this.scene.remove(obj.mesh);
          this.gameObjects.splice(i, 1);
          continue;
        }
      }

      if (obj.type.startsWith('powerup_') && !obj.collected) {
        if (dz < 1.6 && dx < 1.4 && Math.abs(dy) < 1.8) {
          obj.collected = true;
          obj.active = false;
          collectedPowerup = obj.type.replace('powerup_', '');
          this.scene.remove(obj.mesh);
          this.gameObjects.splice(i, 1);
          continue;
        }
      }

      if (obj.type === 'mystery_box' && !obj.collected) {
        if (dz < 1.6 && dx < 1.4 && Math.abs(dy) < 1.8) {
          obj.collected = true;
          obj.active = false;
          collectedMysteryBox = true;
          this.scene.remove(obj.mesh);
          this.gameObjects.splice(i, 1);
          continue;
        }
      }

      // Ramp interaction (smoothly walk up ramp onto train!)
      if (obj.type === 'ramp') {
        if (dz < obj.depth / 2 && dx < obj.width / 2) {
          // Inside ramp bounds
          const rampProgress = (objZ + obj.depth / 2 - playerZ) / obj.depth;
          if (rampProgress >= 0 && rampProgress <= 1.0) {
            const targetY = rampProgress * obj.height;
            if (playerY <= targetY + 0.5) {
              // Push player up along the ramp surface!
              playerY = targetY;
            }
          }
        }
      }

      // Train roof running vs train front collision
      if (obj.type === 'train') {
        if (dz < obj.depth / 2 && dx < obj.width / 2) {
          // If player is on top of train roof (Y >= 2.6)
          if (playerY >= 2.6) {
            // Player is safely running on train roof!
          } else {
            // Player hit front/side of train
            hitObstacle = obj;
          }
        }
      }

      // Low hurdle collision (must jump, Y >= 0.9 clears it)
      if (obj.type === 'hurdle_low') {
        if (dz < obj.depth / 2 + 0.4 && dx < obj.width / 2) {
          if (playerY < 0.8) {
            hitObstacle = obj;
          }
        }
      }

      // High barrier collision (must slide, player height is reduced in slide mode)
      if (obj.type === 'barrier_high') {
        if (dz < obj.depth / 2 + 0.4 && dx < obj.width / 2) {
          // If not sliding, character head hits the high beam
          hitObstacle = obj;
        }
      }

      // Drone collision
      if (obj.type === 'drone') {
        if (dz < obj.depth / 2 + 0.3 && dx < obj.width / 2 && Math.abs(dy) < 1.4) {
          hitObstacle = obj;
        }
      }

      // Remove far objects behind player
      if (objZ > playerZ + 30) {
        this.scene.remove(obj.mesh);
        obj.active = false;
        this.gameObjects.splice(i, 1);
      }
    }

    return {
      collectedCoins,
      collectedPowerup,
      collectedMysteryBox,
      hitObstacle,
      passedPortal,
    };
  }

  public clearAllObstaclesAhead(playerZ: number, range: number = 60) {
    for (let i = this.gameObjects.length - 1; i >= 0; i--) {
      const obj = this.gameObjects[i];
      if (
        obj.z < playerZ &&
        obj.z > playerZ - range &&
        (obj.type === 'hurdle_low' ||
          obj.type === 'barrier_high' ||
          obj.type === 'drone' ||
          obj.type === 'train')
      ) {
        this.scene.remove(obj.mesh);
        obj.active = false;
        this.gameObjects.splice(i, 1);
      }
    }
  }

  public reset(initialThemeType: ThemeType = 'cyberpunk') {
    // Clear all game objects
    this.gameObjects.forEach((obj) => this.scene.remove(obj.mesh));
    this.gameObjects = [];

    // Clear track segments
    this.trackSegments.forEach((seg) => this.scene.remove(seg));
    this.trackSegments = [];

    this.currentTheme = THEMES[initialThemeType];
    this.targetTheme = this.currentTheme;
    this.nextSpawnZ = -20;
    this.distanceTraveled = 0;
    this.nextThemeShiftDistance = 500;

    this.initInitialWorld();
  }
}
