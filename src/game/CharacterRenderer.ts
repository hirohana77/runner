import * as THREE from 'three';
import { CharacterConfig, BoardConfig } from '../types/game';

export class CharacterRenderer {
  public group: THREE.Group;
  private characterConfig: CharacterConfig;
  private boardConfig: BoardConfig;

  // Body parts
  private hips: THREE.Group;
  private spine: THREE.Group;
  private head: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftFoot: THREE.Mesh;
  private rightFoot: THREE.Mesh;
  private jetpack: THREE.Group;
  private jetpackFlames: THREE.Mesh[] = [];
  private hoverboard: THREE.Group;
  private shieldSphere: THREE.Mesh;
  private auraRing: THREE.Mesh;
  private flipGroup: THREE.Group;

  // Animation parameters
  private runCycle: number = 0;
  private doubleJumpRotation: number = 0;
  private isDoubleJumping: boolean = false;
  private slideProgress: number = 0;

  constructor(charConfig: CharacterConfig, boardConfig: BoardConfig) {
    this.characterConfig = charConfig;
    this.boardConfig = boardConfig;
    this.group = new THREE.Group();
    this.flipGroup = new THREE.Group();
    this.group.add(this.flipGroup);

    this.hips = new THREE.Group();
    this.spine = new THREE.Group();
    this.head = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.jetpack = new THREE.Group();
    this.hoverboard = new THREE.Group();

    // Default feet for footwear scaling
    this.leftFoot = new THREE.Mesh();
    this.rightFoot = new THREE.Mesh();

    // Shield mesh
    const shieldGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.shieldSphere = new THREE.Mesh(shieldGeo, shieldMat);
    this.group.add(this.shieldSphere);

    // Aura ring for special skills
    const ringGeo = new THREE.RingGeometry(0.8, 1.1, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff00aa,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.auraRing = new THREE.Mesh(ringGeo, ringMat);
    this.auraRing.position.y = 0.05;
    this.group.add(this.auraRing);

    this.buildCharacterMesh();
    this.buildHoverboardMesh();
    this.buildJetpackMesh();
  }

  public updateConfigs(charConfig: CharacterConfig, boardConfig: BoardConfig) {
    this.characterConfig = charConfig;
    this.boardConfig = boardConfig;
    // Clear and rebuild
    while (this.flipGroup.children.length > 0) {
      this.flipGroup.remove(this.flipGroup.children[0]);
    }
    this.buildCharacterMesh();
    this.buildHoverboardMesh();
    this.buildJetpackMesh();
  }

  private buildCharacterMesh() {
    const colors = this.characterConfig.colorScheme;
    const primColor = new THREE.Color(colors.primary);
    const secColor = new THREE.Color(colors.secondary);
    const skinColor = new THREE.Color(colors.skin);
    const glowColor = new THREE.Color(colors.glow);
    const hairColor = new THREE.Color(colors.hair);

    const primMat = new THREE.MeshStandardMaterial({ color: primColor, roughness: 0.3, metalness: 0.4 });
    const secMat = new THREE.MeshStandardMaterial({ color: secColor, roughness: 0.5, metalness: 0.2 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
    const glowMat = new THREE.MeshBasicMaterial({ color: glowColor });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.7 });

    // Hips
    this.hips = new THREE.Group();
    this.hips.position.y = 1.0;
    this.flipGroup.add(this.hips);

    const pelvisGeo = new THREE.BoxGeometry(0.5, 0.3, 0.35);
    const pelvis = new THREE.Mesh(pelvisGeo, secMat);
    this.hips.add(pelvis);

    // Spine & Torso
    this.spine = new THREE.Group();
    this.spine.position.y = 0.2;
    this.hips.add(this.spine);

    const chestGeo = new THREE.BoxGeometry(0.65, 0.6, 0.4);
    const chest = new THREE.Mesh(chestGeo, primMat);
    chest.position.y = 0.3;
    this.spine.add(chest);

    // Chest glow emblem / stripe
    const emblemGeo = new THREE.BoxGeometry(0.3, 0.2, 0.42);
    const emblem = new THREE.Mesh(emblemGeo, glowMat);
    emblem.position.y = 0.35;
    this.spine.add(emblem);

    // Neck and Head
    this.head = new THREE.Group();
    this.head.position.y = 0.7;
    this.spine.add(this.head);

    const faceGeo = new THREE.BoxGeometry(0.4, 0.42, 0.4);
    const face = new THREE.Mesh(faceGeo, skinMat);
    this.head.add(face);

    // Eyes / Visor depending on character
    if (this.characterConfig.modelType === 'astro_nova' || this.characterConfig.modelType === 'mecha_rex') {
      const visorGeo = new THREE.BoxGeometry(0.42, 0.16, 0.42);
      const visorMat = new THREE.MeshBasicMaterial({ color: glowColor });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 0.05, 0.03);
      this.head.add(visor);
    } else {
      // Glasses / Bandana
      const eyeGeo = new THREE.BoxGeometry(0.35, 0.12, 0.42);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111122 });
      const eyes = new THREE.Mesh(eyeGeo, eyeMat);
      eyes.position.set(0, 0.05, 0.02);
      this.head.add(eyes);
    }

    // Hair / Cap / Helmet
    if (this.characterConfig.modelType === 'street_runner') {
      const capGeo = new THREE.BoxGeometry(0.44, 0.15, 0.44);
      const cap = new THREE.Mesh(capGeo, primMat);
      cap.position.y = 0.22;
      this.head.add(cap);

      const brimGeo = new THREE.BoxGeometry(0.42, 0.04, 0.25);
      const brim = new THREE.Mesh(brimGeo, primMat);
      brim.position.set(0, 0.18, 0.28);
      this.head.add(brim);
    } else if (this.characterConfig.modelType === 'shrine_fox') {
      // Fox ears
      const earGeo = new THREE.ConeGeometry(0.12, 0.3, 4);
      const ear1 = new THREE.Mesh(earGeo, primMat);
      ear1.position.set(-0.16, 0.32, 0);
      const ear2 = new THREE.Mesh(earGeo, primMat);
      ear2.position.set(0.16, 0.32, 0);
      this.head.add(ear1, ear2);
    } else {
      const hairGeo = new THREE.BoxGeometry(0.44, 0.2, 0.44);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.y = 0.2;
      this.head.add(hair);
    }

    // Arms
    this.leftArm = this.createLimb(0.18, 0.6, primMat, skinMat, true);
    this.leftArm.position.set(-0.42, 0.5, 0);
    this.spine.add(this.leftArm);

    this.rightArm = this.createLimb(0.18, 0.6, primMat, skinMat, true);
    this.rightArm.position.set(0.42, 0.5, 0);
    this.spine.add(this.rightArm);

    // Legs
    const [leftLegGroup, leftFootMesh] = this.createLeg(0.2, 0.8, secMat, primMat);
    this.leftLeg = leftLegGroup;
    this.leftFoot = leftFootMesh;
    this.leftLeg.position.set(-0.18, -0.15, 0);
    this.hips.add(this.leftLeg);

    const [rightLegGroup, rightFootMesh] = this.createLeg(0.2, 0.8, secMat, primMat);
    this.rightLeg = rightLegGroup;
    this.rightFoot = rightFootMesh;
    this.rightLeg.position.set(0.18, -0.15, 0);
    this.hips.add(this.rightLeg);

    // Accessories
    if (this.characterConfig.modelType === 'cyber_ninja') {
      // Katana on back
      const scabbardGeo = new THREE.BoxGeometry(0.08, 1.2, 0.08);
      const scabbardMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
      const scabbard = new THREE.Mesh(scabbardGeo, scabbardMat);
      scabbard.position.set(0, 0.35, -0.28);
      scabbard.rotation.z = Math.PI / 4;
      this.spine.add(scabbard);
    }
  }

  private createLimb(width: number, length: number, clothMat: THREE.Material, skinMat: THREE.Material, isArm: boolean): THREE.Group {
    const limb = new THREE.Group();
    const upperGeo = new THREE.BoxGeometry(width, length * 0.5, width);
    const upper = new THREE.Mesh(upperGeo, clothMat);
    upper.position.y = -length * 0.25;
    limb.add(upper);

    const lowerGeo = new THREE.BoxGeometry(width * 0.9, length * 0.5, width * 0.9);
    const lower = new THREE.Mesh(lowerGeo, isArm ? skinMat : clothMat);
    lower.position.y = -length * 0.7;
    limb.add(lower);

    return limb;
  }

  private createLeg(width: number, length: number, pantsMat: THREE.Material, shoeMat: THREE.Material): [THREE.Group, THREE.Mesh] {
    const leg = new THREE.Group();
    const upperGeo = new THREE.BoxGeometry(width, length * 0.5, width * 1.1);
    const upper = new THREE.Mesh(upperGeo, pantsMat);
    upper.position.y = -length * 0.25;
    leg.add(upper);

    const lowerGeo = new THREE.BoxGeometry(width * 0.95, length * 0.45, width * 0.95);
    const lower = new THREE.Mesh(lowerGeo, pantsMat);
    lower.position.y = -length * 0.65;
    leg.add(lower);

    // Shoe
    const shoeGeo = new THREE.BoxGeometry(width * 1.2, length * 0.2, width * 1.8);
    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0, -length * 0.9, width * 0.3);
    leg.add(shoe);

    return [leg, shoe];
  }

  private buildHoverboardMesh() {
    this.hoverboard = new THREE.Group();
    this.hoverboard.position.set(0, 0.12, 0);
    this.flipGroup.add(this.hoverboard);

    const boardColor = new THREE.Color(this.boardConfig.color);
    const glowColor = new THREE.Color(this.boardConfig.glowColor);

    // Main deck
    const deckGeo = new THREE.BoxGeometry(0.7, 0.08, 1.8);
    const deckMat = new THREE.MeshStandardMaterial({
      color: boardColor,
      roughness: 0.3,
      metalness: 0.7,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    this.hoverboard.add(deck);

    // Neon edge rails
    const edgeGeo = new THREE.BoxGeometry(0.74, 0.05, 1.84);
    const edgeMat = new THREE.MeshBasicMaterial({ color: glowColor });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.y = 0.01;
    this.hoverboard.add(edge);

    // Dual thrusters under deck
    const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.25, 12);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
    const t1 = new THREE.Mesh(thrusterGeo, thrusterMat);
    t1.position.set(-0.2, -0.08, -0.6);
    const t2 = new THREE.Mesh(thrusterGeo, thrusterMat);
    t2.position.set(0.2, -0.08, -0.6);
    this.hoverboard.add(t1, t2);

    this.hoverboard.visible = false;
  }

  private buildJetpackMesh() {
    this.jetpack = new THREE.Group();
    this.jetpack.position.set(0, 0.3, -0.32);
    this.spine.add(this.jetpack);

    const tankMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.8, roughness: 0.2 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Dual tanks
    const tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 12);
    const tank1 = new THREE.Mesh(tankGeo, tankMat);
    tank1.position.x = -0.16;
    const tank2 = new THREE.Mesh(tankGeo, tankMat);
    tank2.position.x = 0.16;
    this.jetpack.add(tank1, tank2);

    // Center bridge
    const bridgeGeo = new THREE.BoxGeometry(0.4, 0.3, 0.15);
    const bridge = new THREE.Mesh(bridgeGeo, tankMat);
    this.jetpack.add(bridge);

    // Thruster cones
    const nozzleGeo = new THREE.ConeGeometry(0.14, 0.2, 12);
    nozzleGeo.rotateX(Math.PI);
    const n1 = new THREE.Mesh(nozzleGeo, glowMat);
    n1.position.set(-0.16, -0.4, 0);
    const n2 = new THREE.Mesh(nozzleGeo, glowMat);
    n2.position.set(0.16, -0.4, 0);
    this.jetpack.add(n1, n2);

    // Animated flame meshes
    const flameGeo = new THREE.ConeGeometry(0.12, 0.5, 8);
    flameGeo.rotateX(Math.PI);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.85 });

    const f1 = new THREE.Mesh(flameGeo, flameMat);
    f1.position.set(-0.16, -0.65, 0);
    const f2 = new THREE.Mesh(flameGeo, flameMat);
    f2.position.set(0.16, -0.65, 0);
    this.jetpack.add(f1, f2);
    this.jetpackFlames = [f1, f2];

    this.jetpack.visible = false;
  }

  public triggerDoubleJump() {
    this.isDoubleJumping = true;
    this.doubleJumpRotation = 0;
  }

  public updateAnimation(
    delta: number,
    state: {
      action: string;
      speed: number;
      isGrounded: boolean;
      jumpProgress: number;
      isSliding: boolean;
      hasBoard: boolean;
      hasJetpack: boolean;
      hasShield: boolean;
      hasSneakers: boolean;
      skillActive: boolean;
      tiltX: number; // for lane dodging lean
    }
  ) {
    this.runCycle += delta * state.speed * 0.9;

    // Hoverboard & Jetpack visibility
    this.hoverboard.visible = state.hasBoard;
    this.jetpack.visible = state.hasJetpack;

    // Shield visibility & pulse
    if (state.hasShield) {
      (this.shieldSphere.material as THREE.MeshStandardMaterial).opacity = 0.5 + Math.sin(this.runCycle * 4) * 0.2;
      this.shieldSphere.rotation.y += delta * 2;
    } else {
      (this.shieldSphere.material as THREE.MeshStandardMaterial).opacity = 0;
    }

    // Skill Aura ring
    if (state.skillActive) {
      (this.auraRing.material as THREE.MeshBasicMaterial).opacity = 0.7 + Math.sin(this.runCycle * 6) * 0.25;
      this.auraRing.rotation.z += delta * 4;
      const s = 1 + Math.sin(this.runCycle * 8) * 0.1;
      this.auraRing.scale.set(s, s, s);
    } else {
      (this.auraRing.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    // Sneakers shoe scale & glow
    if (state.hasSneakers) {
      const sneakerScale = 1.4 + Math.sin(this.runCycle * 5) * 0.1;
      this.leftFoot.scale.set(sneakerScale, sneakerScale, sneakerScale);
      this.rightFoot.scale.set(sneakerScale, sneakerScale, sneakerScale);
    } else {
      this.leftFoot.scale.set(1, 1, 1);
      this.rightFoot.scale.set(1, 1, 1);
    }

    // Jetpack flames flickering
    if (state.hasJetpack) {
      const flameScale = 0.8 + Math.random() * 0.4;
      this.jetpackFlames.forEach((f) => {
        f.scale.set(flameScale, flameScale * 1.2, flameScale);
      });
    }

    // Lane change tilt
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, -state.tiltX * 0.35, delta * 12);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, state.tiltX * 0.25, delta * 12);

    // Double Jump Flip Animation
    if (this.isDoubleJumping) {
      this.doubleJumpRotation += delta * 14;
      this.flipGroup.rotation.x = this.doubleJumpRotation;
      if (this.doubleJumpRotation >= Math.PI * 2) {
        this.isDoubleJumping = false;
        this.doubleJumpRotation = 0;
        this.flipGroup.rotation.x = 0;
      }
    } else {
      this.flipGroup.rotation.x = 0;
    }

    // Sliding Animation Pose
    if (state.isSliding) {
      this.slideProgress = Math.min(1, this.slideProgress + delta * 8);
    } else {
      this.slideProgress = Math.max(0, this.slideProgress - delta * 8);
    }

    if (this.slideProgress > 0) {
      const t = this.slideProgress;
      this.hips.position.y = THREE.MathUtils.lerp(1.0, 0.35, t);
      this.spine.rotation.x = THREE.MathUtils.lerp(0, -0.85, t); // lean back
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(0, 1.4, t); // kick forward
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(0, -0.6, t); // tuck under
      this.leftArm.rotation.x = THREE.MathUtils.lerp(0, -1.2, t);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(0, 0.8, t);
      return;
    }

    // Jetpack Flying Pose
    if (state.hasJetpack) {
      this.hips.position.y = 1.1;
      this.spine.rotation.x = 0.5; // lean forward horizontally
      this.leftLeg.rotation.x = -0.3 + Math.sin(this.runCycle * 2) * 0.1;
      this.rightLeg.rotation.x = -0.4 - Math.sin(this.runCycle * 2) * 0.1;
      this.leftArm.rotation.x = -0.8;
      this.rightArm.rotation.x = -0.8;
      return;
    }

    // Hoverboard Surfing Pose
    if (state.hasBoard) {
      this.hips.position.y = 1.05;
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, 0.4, delta * 8); // surfing stance
      this.spine.rotation.x = 0.1;
      this.leftLeg.rotation.x = 0.2;
      this.leftLeg.rotation.z = -0.2;
      this.rightLeg.rotation.x = -0.2;
      this.rightLeg.rotation.z = 0.2;
      this.leftArm.rotation.x = 0.6;
      this.rightArm.rotation.x = -0.6;
      this.hoverboard.rotation.z = Math.sin(this.runCycle * 3) * 0.08;
      return;
    }

    // Jump Pose (in air)
    if (!state.isGrounded) {
      this.hips.position.y = 1.0;
      this.spine.rotation.x = 0.2;
      this.leftLeg.rotation.x = 0.6;
      this.rightLeg.rotation.x = -0.7;
      this.leftArm.rotation.x = -1.4;
      this.rightArm.rotation.x = -1.2;
      return;
    }

    // Normal Running Pose
    this.hips.position.y = 1.0 + Math.abs(Math.sin(this.runCycle)) * 0.12;
    this.spine.rotation.x = 0.15; // athletic forward tilt
    this.spine.rotation.y = Math.sin(this.runCycle) * 0.08;

    const legAngle = Math.sin(this.runCycle) * 0.85;
    this.leftLeg.rotation.x = legAngle;
    this.rightLeg.rotation.x = -legAngle;

    const armAngle = Math.sin(this.runCycle) * 0.95;
    this.leftArm.rotation.x = -armAngle;
    this.rightArm.rotation.x = armAngle;
  }
}
