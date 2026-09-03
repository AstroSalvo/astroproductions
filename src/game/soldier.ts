import * as THREE from "three";
import type { MatLib } from "./materials";

export type Stance = "idle" | "walk" | "run" | "stealth";
export type Kind = "operative" | "sentry";

type Bones = {
  hip: THREE.Group;
  torso: THREE.Group;
  chest: THREE.Group;
  head: THREE.Group;
  shoulderL: THREE.Group;
  upperArmL: THREE.Group;
  lowerArmL: THREE.Group;
  shoulderR: THREE.Group;
  upperArmR: THREE.Group;
  lowerArmR: THREE.Group;
  thighL: THREE.Group;
  shinL: THREE.Group;
  thighR: THREE.Group;
  shinR: THREE.Group;
};

function sph(r: number, w = 9, h = 7) {
  return new THREE.SphereGeometry(r, w, h);
}

function cyl(rt: number, rb: number, len: number, segs = 8) {
  return new THREE.CylinderGeometry(rt, rb, len, segs, 1);
}

function cap(r: number, len: number, segs = 8) {
  return new THREE.CapsuleGeometry(r, len, 4, segs);
}

export class Soldier {
  root = new THREE.Group();
  kind: Kind;
  bones: Bones;
  private crouch = 0;
  private phase = Math.random() * Math.PI * 2;
  private lookT = 0;
  private lookY = 0;
  private lookX = 0;
  private rifle: THREE.Group | null = null;

  constructor(kind: Kind, mats: MatLib) {
    this.kind = kind;
    this.root.name = kind;
    const body = kind === "operative" ? mats.operative : mats.sentry;
    const accent = kind === "operative" ? mats.operativeAccent : mats.sentryDark;
    const boot = mats.boot;

    const hip = new THREE.Group();
    hip.position.y = 0.92;
    this.root.add(hip);

    const pelvis = new THREE.Mesh(cap(0.16, 0.12, 8), body);
    pelvis.scale.set(1.35, 0.85, 1.05);
    pelvis.castShadow = true;
    hip.add(pelvis);

    const torso = new THREE.Group();
    torso.position.y = 0.12;
    hip.add(torso);

    const chest = new THREE.Group();
    torso.add(chest);
    const rib = new THREE.Mesh(cap(0.2, 0.28, 9), body);
    rib.scale.set(1.28, 1, 0.92);
    rib.position.y = 0.28;
    rib.castShadow = true;
    chest.add(rib);

    const pack = new THREE.Mesh(cap(0.1, 0.18, 7), accent);
    pack.scale.set(1.4, 0.9, 0.55);
    pack.position.set(0, 0.28, -0.2);
    pack.rotation.x = 0.15;
    pack.castShadow = true;
    chest.add(pack);

    if (kind === "sentry") {
      const harness = new THREE.Mesh(cyl(0.23, 0.23, 0.06, 8), mats.sentryDark);
      harness.position.y = 0.22;
      harness.scale.set(1.15, 1, 0.85);
      chest.add(harness);
    }

    const neck = new THREE.Mesh(cyl(0.07, 0.08, 0.1, 7), mats.skin);
    neck.position.y = 0.5;
    chest.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.62;
    chest.add(head);
    const skull = new THREE.Mesh(sph(0.155, 10, 8), mats.skin);
    skull.scale.set(0.95, 1.05, 0.98);
    skull.castShadow = true;
    head.add(skull);

    if (kind === "operative") {
      const helm = new THREE.Mesh(sph(0.168, 10, 8), mats.bandana);
      helm.scale.set(1.02, 0.72, 1.05);
      helm.position.y = 0.05;
      head.add(helm);
      const tail = new THREE.Mesh(cap(0.04, 0.22, 6), mats.bandana);
      tail.position.set(0.02, 0.04, -0.2);
      tail.rotation.x = 0.9;
      tail.rotation.z = 0.15;
      head.add(tail);
      const ear = new THREE.Mesh(sph(0.035, 6, 5), mats.metal);
      ear.position.set(0.15, 0.0, 0.02);
      head.add(ear);
    } else {
      const helm = new THREE.Mesh(sph(0.175, 10, 8), mats.helmet);
      helm.scale.set(1.08, 0.82, 1.12);
      helm.position.y = 0.04;
      helm.castShadow = true;
      head.add(helm);
      const brim = new THREE.Mesh(cyl(0.2, 0.18, 0.05, 10), mats.helmet);
      brim.position.y = 0.02;
      brim.scale.set(1, 1, 0.95);
      head.add(brim);
      const visor = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, 1.1), mats.visor);
      visor.scale.set(1.05, 0.55, 0.7);
      visor.position.set(0, 0.02, 0.08);
      visor.rotation.x = 0.35;
      head.add(visor);
    }

    const mkArm = (side: number) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(0.26 * side, 0.42, 0.02);
      chest.add(shoulder);
      const pad = new THREE.Mesh(sph(0.09, 8, 6), accent);
      pad.scale.set(1.1, 0.8, 1);
      pad.castShadow = true;
      shoulder.add(pad);

      const upper = new THREE.Group();
      shoulder.add(upper);
      const ua = new THREE.Mesh(cyl(0.065, 0.05, 0.28, 7), body);
      ua.position.y = -0.16;
      ua.castShadow = true;
      upper.add(ua);
      const elbow = new THREE.Mesh(sph(0.05, 7, 5), body);
      elbow.position.y = -0.3;
      upper.add(elbow);

      const lower = new THREE.Group();
      lower.position.y = -0.3;
      upper.add(lower);
      const la = new THREE.Mesh(cyl(0.048, 0.04, 0.24, 7), body);
      la.position.y = -0.14;
      la.castShadow = true;
      lower.add(la);
      const hand = new THREE.Mesh(sph(0.048, 7, 5), mats.skin);
      hand.scale.set(1, 0.85, 0.75);
      hand.position.y = -0.28;
      lower.add(hand);
      return { shoulder, upper, lower };
    };

    const armL = mkArm(-1);
    const armR = mkArm(1);

    const mkLeg = (side: number) => {
      const thigh = new THREE.Group();
      thigh.position.set(0.11 * side, -0.04, 0);
      hip.add(thigh);
      const hipJoint = new THREE.Mesh(sph(0.09, 8, 6), body);
      hipJoint.castShadow = true;
      thigh.add(hipJoint);
      const th = new THREE.Mesh(cyl(0.09, 0.07, 0.36, 8), body);
      th.position.y = -0.2;
      th.castShadow = true;
      thigh.add(th);

      const shin = new THREE.Group();
      shin.position.y = -0.38;
      thigh.add(shin);
      const kn = new THREE.Mesh(sph(0.065, 7, 5), body);
      shin.add(kn);
      const sh = new THREE.Mesh(cyl(0.065, 0.05, 0.34, 8), body);
      sh.position.y = -0.18;
      sh.castShadow = true;
      shin.add(sh);
      const foot = new THREE.Mesh(cap(0.055, 0.12, 6), boot);
      foot.rotation.x = Math.PI / 2;
      foot.position.set(0, -0.36, 0.05);
      foot.scale.set(1, 1.15, 0.85);
      foot.castShadow = true;
      shin.add(foot);
      return { thigh, shin };
    };

    const legL = mkLeg(-1);
    const legR = mkLeg(1);

    if (kind === "sentry") {
      const rifle = new THREE.Group();
      rifle.position.set(0.12, 0.18, 0.18);
      rifle.rotation.set(-0.15, 0.4, -0.5);
      chest.add(rifle);
      const bodyR = new THREE.Mesh(cap(0.035, 0.28, 6), mats.metal);
      bodyR.rotation.z = Math.PI / 2;
      rifle.add(bodyR);
      const barrel = new THREE.Mesh(cyl(0.018, 0.016, 0.38, 6), mats.metal);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.x = 0.28;
      rifle.add(barrel);
      const stock = new THREE.Mesh(cyl(0.03, 0.022, 0.16, 6), mats.sentryDark);
      stock.rotation.z = Math.PI / 2;
      stock.position.x = -0.18;
      rifle.add(stock);
      const mag = new THREE.Mesh(cap(0.02, 0.08, 5), mats.sentryDark);
      mag.position.set(0.04, -0.08, 0);
      rifle.add(mag);
      this.rifle = rifle;
    } else {
      const holster = new THREE.Mesh(cap(0.04, 0.1, 6), mats.boot);
      holster.position.set(0.16, -0.02, 0.04);
      holster.rotation.z = 0.4;
      hip.add(holster);
    }

    this.bones = {
      hip,
      torso,
      chest,
      head,
      shoulderL: armL.shoulder,
      upperArmL: armL.upper,
      lowerArmL: armL.lower,
      shoulderR: armR.shoulder,
      upperArmR: armR.upper,
      lowerArmR: armR.lower,
      thighL: legL.thigh,
      shinL: legL.shin,
      thighR: legR.thigh,
      shinR: legR.shin,
    };

    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }

  setVisible(v: boolean) {
    this.root.visible = v;
  }

  update(dt: number, stance: Stance, yaw: number, moving: boolean) {
    this.root.rotation.y = yaw;
    const targetCrouch = stance === "stealth" ? 1 : 0;
    this.crouch += (targetCrouch - this.crouch) * Math.min(1, dt * 8);

    const freq = stance === "run" ? 9.2 : stance === "walk" ? 6.4 : stance === "stealth" ? 4.2 : 0;
    if (moving && freq > 0) this.phase += dt * freq;
    else this.phase += dt * 1.6;

    this.lookT -= dt;
    if (this.lookT <= 0) {
      this.lookT = 1.4 + Math.random() * 2.2;
      this.lookY = (Math.random() - 0.5) * 0.45;
      this.lookX = (Math.random() - 0.5) * 0.12;
    }

    const s = Math.sin(this.phase);
    const c = Math.cos(this.phase);
    const breath = Math.sin(this.phase * (moving ? 0.5 : 0.35));
    const crouch = this.crouch;

    const amp = stance === "run" ? 0.78 : stance === "walk" ? 0.52 : stance === "stealth" ? 0.28 : 0.06;
    const armAmp = stance === "run" ? 0.9 : stance === "walk" ? 0.45 : stance === "stealth" ? 0.18 : 0.08;
    const lean = stance === "run" ? 0.22 : stance === "stealth" ? 0.32 : stance === "walk" ? 0.06 : 0.02;

    this.bones.hip.position.y = 0.92 - crouch * 0.34 + (moving ? Math.abs(s) * (stance === "run" ? 0.05 : 0.025) : breath * 0.012);
    this.bones.hip.rotation.z = moving ? s * 0.04 : breath * 0.015;
    this.bones.hip.rotation.y = moving ? c * 0.05 : 0;

    this.bones.torso.rotation.x = lean + breath * 0.03 + crouch * 0.08;
    this.bones.torso.rotation.y = moving ? -s * 0.08 : breath * 0.04;
    this.bones.chest.rotation.x = breath * 0.025;

    this.bones.head.rotation.y += (this.lookY - this.bones.head.rotation.y) * Math.min(1, dt * 2);
    this.bones.head.rotation.x += (this.lookX - crouch * 0.15 - this.bones.head.rotation.x) * Math.min(1, dt * 2);

    const swing = moving ? s * amp : breath * 0.04;
    this.bones.thighL.rotation.x = crouch * 0.85 + swing;
    this.bones.thighR.rotation.x = crouch * 0.85 - swing;
    this.bones.shinL.rotation.x = crouch * 0.7 + Math.max(0, -s) * (stance === "run" ? 0.7 : 0.4);
    this.bones.shinR.rotation.x = crouch * 0.7 + Math.max(0, s) * (stance === "run" ? 0.7 : 0.4);

    const hang = 0.12 + crouch * 0.35;
    this.bones.upperArmL.rotation.x = hang + (moving ? -s * armAmp : breath * 0.06);
    this.bones.upperArmR.rotation.x = hang + (moving ? s * armAmp : -breath * 0.06);
    this.bones.upperArmL.rotation.z = 0.12 + crouch * 0.15;
    this.bones.upperArmR.rotation.z = -0.12 - crouch * 0.15;
    this.bones.lowerArmL.rotation.x = (stance === "run" ? 0.7 : 0.25) + crouch * 0.4;
    this.bones.lowerArmR.rotation.x = (stance === "run" ? 0.7 : 0.25) + crouch * 0.4;

    if (stance === "stealth") {
      this.bones.upperArmL.rotation.x = 0.85 + s * 0.12;
      this.bones.upperArmR.rotation.x = 0.9 - s * 0.12;
      this.bones.upperArmL.rotation.z = 0.35;
      this.bones.upperArmR.rotation.z = -0.28;
      this.bones.lowerArmL.rotation.x = 0.55;
      this.bones.lowerArmR.rotation.x = 0.5;
    }

    if (this.kind === "sentry") {
      this.bones.upperArmR.rotation.x = 0.55;
      this.bones.upperArmR.rotation.z = -0.35;
      this.bones.lowerArmR.rotation.x = 0.7;
      this.bones.upperArmL.rotation.x = 0.45;
      this.bones.lowerArmL.rotation.x = 0.85;
    }
  }
}
