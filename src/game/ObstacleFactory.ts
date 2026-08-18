import * as THREE from 'three';
import { ThemeConfig } from '../types/game';

export type ObstacleType =
  | 'hurdle_low'
  | 'barrier_high'
  | 'train'
  | 'ramp'
  | 'drone'
  | 'coin'
  | 'powerup_magnet'
  | 'powerup_jetpack'
  | 'powerup_sneakers'
  | 'powerup_multiplier'
  | 'mystery_box'
  | 'warp_portal';

export interface GameObject {
  mesh: THREE.Group;
  type: ObstacleType;
  lane: number; // -1, 0, 1
  z: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  collected?: boolean;
  isMoving?: boolean;
  moveSpeed?: number;
  active: boolean;
}

export class ObstacleFactory {
  // Shared reusable geometries and materials
  private coinGeo: THREE.CylinderGeometry;
  private coinMat: THREE.MeshStandardMaterial;

  constructor() {
    this.coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.12, 16);
    this.coinGeo.rotateZ(Math.PI / 2);
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xff8800,
      emissiveIntensity: 0.4,
    });
  }

  public createLowHurdle(theme: ThemeConfig): THREE.Group {
    const group = new THREE.Group();
    const primaryColor = new THREE.Color(theme.railColor);
    const accentColor = new THREE.Color(theme.accentColor);

    if (theme.sceneryType === 'torii_pagoda') {
      // Shrine wooden hurdle with paper seals
      const postGeo = new THREE.BoxGeometry(0.18, 0.9, 0.18);
      const beamGeo = new THREE.BoxGeometry(2.4, 0.22, 0.22);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0xb83227, roughness: 0.6 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.7 });

      const p1 = new THREE.Mesh(postGeo, woodMat);
      p1.position.set(-1.0, 0.45, 0);
      const p2 = new THREE.Mesh(postGeo, woodMat);
      p2.position.set(1.0, 0.45, 0);
      const beam = new THREE.Mesh(beamGeo, woodMat);
      beam.position.set(0, 0.75, 0);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.25), goldMat);
      trim.position.set(0, 0.88, 0);

      group.add(p1, p2, beam, trim);
    } else {
      // Cyber / Subway barrier with warning stripes & neon light bar
      const baseGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.8 });
      const p1 = new THREE.Mesh(baseGeo, baseMat);
      p1.position.set(-1.0, 0.4, 0);
      const p2 = new THREE.Mesh(baseGeo, baseMat);
      p2.position.set(1.0, 0.4, 0);

      const barGeo = new THREE.BoxGeometry(2.3, 0.2, 0.15);
      const barMat = new THREE.MeshStandardMaterial({ color: primaryColor, metalness: 0.5 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(0, 0.65, 0);

      const lightGeo = new THREE.BoxGeometry(2.1, 0.06, 0.18);
      const lightMat = new THREE.MeshBasicMaterial({ color: accentColor });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(0, 0.65, 0);

      group.add(p1, p2, bar, light);
    }

    return group;
  }

  public createHighBarrier(theme: ThemeConfig): THREE.Group {
    const group = new THREE.Group();
    const primaryColor = new THREE.Color(theme.neonColors[0] || 0x00f0ff);
    const secColor = new THREE.Color(theme.neonColors[1] || 0xff007f);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, metalness: 0.9, roughness: 0.3 });
    const beamMat = new THREE.MeshStandardMaterial({ color: secColor, metalness: 0.6 });
    const signMat = new THREE.MeshBasicMaterial({ color: primaryColor });

    // Tall side pillars (player slides under the top beam)
    const pillarGeo = new THREE.BoxGeometry(0.25, 3.8, 0.25);
    const p1 = new THREE.Mesh(pillarGeo, metalMat);
    p1.position.set(-1.1, 1.9, 0);
    const p2 = new THREE.Mesh(pillarGeo, metalMat);
    p2.position.set(1.1, 1.9, 0);

    // Overhead high block (covers Y = 1.3 to 3.6, leaving clear duck gap below 1.3m)
    const topBarGeo = new THREE.BoxGeometry(2.4, 1.8, 0.4);
    const topBar = new THREE.Mesh(topBarGeo, beamMat);
    topBar.position.set(0, 2.5, 0);

    // Neon hazard signage
    const signGeo = new THREE.BoxGeometry(2.0, 0.6, 0.45);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.5, 0);

    group.add(p1, p2, topBar, sign);
    return group;
  }

  public createTrain(theme: ThemeConfig, length: number = 18): THREE.Group {
    const group = new THREE.Group();
    const trainMat = new THREE.MeshStandardMaterial({
      color: 0x1e2438,
      metalness: 0.8,
      roughness: 0.25,
    });
    const stripeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.neonColors[0]) });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a1020, roughness: 0.1, metalness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2d3448, roughness: 0.5 });
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Main body
    const bodyGeo = new THREE.BoxGeometry(2.4, 2.8, length);
    const body = new THREE.Mesh(bodyGeo, trainMat);
    body.position.set(0, 1.5, 0);
    group.add(body);

    // Roof walkway (where player can run safely!)
    const roofGeo = new THREE.BoxGeometry(2.2, 0.12, length - 0.4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 2.95, 0);
    group.add(roof);

    // Side Neon Stripes
    const stripeGeo = new THREE.BoxGeometry(2.46, 0.25, length - 1.0);
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 1.8, 0);
    group.add(stripe);

    // Front / Back Windows
    const windowGeo = new THREE.BoxGeometry(2.0, 0.8, length + 0.05);
    const windows = new THREE.Mesh(windowGeo, glassMat);
    windows.position.set(0, 2.0, 0);
    group.add(windows);

    // Front Headlights
    const lightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.2);
    const hl1 = new THREE.Mesh(lightGeo, headlightMat);
    hl1.position.set(-0.7, 1.1, -length / 2 - 0.02);
    const hl2 = new THREE.Mesh(lightGeo, headlightMat);
    hl2.position.set(0.7, 1.1, -length / 2 - 0.02);
    group.add(hl1, hl2);

    return group;
  }

  public createRamp(theme: ThemeConfig): THREE.Group {
    const group = new THREE.Group();
    const rampLength = 6.0;
    const rampHeight = 2.8;
    const rampWidth = 2.2;

    // Wedge ramp geometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, rampHeight);
    shape.lineTo(rampLength, 0);
    shape.closePath();

    const extrudeSettings = { depth: rampWidth, bevelEnabled: false };
    const rampGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    rampGeo.center();
    rampGeo.rotateY(-Math.PI / 2);

    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x333b52,
      metalness: 0.7,
      roughness: 0.3,
    });
    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.position.set(0, rampHeight / 2, 0);
    group.add(rampMesh);

    // Glowing arrows on ramp
    const arrowGeo = new THREE.BoxGeometry(1.6, 0.05, 0.4);
    const arrowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.accentColor) });
    for (let i = -1.5; i <= 1.5; i += 1.2) {
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      const t = (i + 1.5) / 3.0;
      arrow.position.set(0, 0.3 + t * 2.2, i);
      arrow.rotation.x = Math.atan2(rampHeight, rampLength);
      group.add(arrow);
    }

    return group;
  }

  public createDrone(theme: ThemeConfig): THREE.Group {
    const group = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const eyeGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0, -0.35);
    group.add(eye);

    const ringGeo = new THREE.TorusGeometry(0.75, 0.05, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.neonColors[0]) });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.position.y = 1.6;
    return group;
  }

  public createCoin(): THREE.Group {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(this.coinGeo, this.coinMat);
    group.add(mesh);

    // Inner star/diamond sparkle
    const starGeo = new THREE.OctahedronGeometry(0.18);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const star = new THREE.Mesh(starGeo, starMat);
    group.add(star);

    return group;
  }

  public createPowerup(type: 'magnet' | 'jetpack' | 'sneakers' | 'multiplier'): THREE.Group {
    const group = new THREE.Group();

    // Floating outer bubble / diamond ring
    const bubbleGeo = new THREE.OctahedronGeometry(0.65);
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      metalness: 0.9,
      roughness: 0.1,
    });
    const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
    group.add(bubble);

    if (type === 'magnet') {
      // Horseshoe Magnet
      const magnetGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 16, Math.PI);
      const magnetMat = new THREE.MeshStandardMaterial({ color: 0xff2222, metalness: 0.7 });
      const magnet = new THREE.Mesh(magnetGeo, magnetMat);
      magnet.rotation.z = Math.PI;
      group.add(magnet);
    } else if (type === 'jetpack') {
      // Mini Rocket
      const rocketGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.5, 8);
      const rocketMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8 });
      const rocket = new THREE.Mesh(rocketGeo, rocketMat);
      group.add(rocket);
    } else if (type === 'sneakers') {
      // Golden Winged Shoe
      const shoeGeo = new THREE.BoxGeometry(0.35, 0.25, 0.5);
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8 });
      const shoe = new THREE.Mesh(shoeGeo, shoeMat);
      group.add(shoe);
    } else {
      // 2X Multiplier cube
      const cubeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const cubeMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      group.add(cube);
    }

    return group;
  }

  public createMysteryBox(): THREE.Group {
    const group = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x9d4edd,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0x7b2cbf,
      emissiveIntensity: 0.5,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    const ribbonGeo = new THREE.BoxGeometry(0.64, 0.64, 0.12);
    const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
    const r1 = new THREE.Mesh(ribbonGeo, ribbonMat);
    const r2 = new THREE.Mesh(ribbonGeo, ribbonMat);
    r2.rotation.y = Math.PI / 2;
    group.add(r1, r2);

    return group;
  }

  public createWarpPortal(fromTheme: ThemeConfig, toTheme: ThemeConfig): THREE.Group {
    const group = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(3.5, 0.35, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(toTheme.neonColors[0]),
      emissive: new THREE.Color(toTheme.accentColor),
      emissiveIntensity: 1.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 3.5;
    group.add(ring);

    // Inner vortex disk
    const diskGeo = new THREE.CircleGeometry(3.2, 32);
    const diskMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(toTheme.skyColor),
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.position.y = 3.5;
    group.add(disk);

    return group;
  }
}
