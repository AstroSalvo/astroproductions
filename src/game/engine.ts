import * as THREE from "three";
import { createMaterials, disposeMaterials, makeMarkTexture, type MatLib } from "./materials";
import { buildLevel } from "./level";
import { Soldier } from "./soldier";
import { Input } from "./input";
import { AudioSys } from "./audio";
import { CrtPass } from "./crt";
import { createSim, stepSim, resetSim, coneRange, type SimState } from "./sim";
import { VISION_HALF, TAPE_POS } from "./constants";
import { useHud } from "@/store/game";

const FIXED = 1 / 60;

export class GameEngine {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  input = new Input();
  audio = new AudioSys();
  sim: SimState = createSim();
  private mats: MatLib;
  private playerChar: Soldier;
  private guardChar: Soldier;
  private crt: CrtPass;
  private cone: THREE.Mesh;
  private mark: THREE.Sprite;
  private markMat: THREE.SpriteMaterial;
  private bangTex: THREE.CanvasTexture;
  private qTex: THREE.CanvasTexture;
  private level: ReturnType<typeof buildLevel>;
  private boxWorn: THREE.Group;
  private acc = 0;
  private last = performance.now();
  private running = false;
  private raf = 0;
  private hudClock = 0;
  private camTarget = new THREE.Vector3();
  private camPos = new THREE.Vector3(0.4, 20.6, 15.4);
  private look = new THREE.Vector3(0.2, 0.2, -0.8);
  private tmp = new THREE.Vector3();
  private onResize: () => void;
  private onVis: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    this.scene.background = new THREE.Color(0x8e978a);

    const hemi = new THREE.HemisphereLight(0xd5ddd0, 0x4a5248, 0.95);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xf2f0e4, 1.45);
    dir.position.set(9, 18, 11);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 2;
    dir.shadow.camera.far = 48;
    dir.shadow.camera.left = -18;
    dir.shadow.camera.right = 16;
    dir.shadow.camera.top = 16;
    dir.shadow.camera.bottom = -16;
    dir.shadow.bias = -0.0008;
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0xc9d2c4, 0.35);
    fill.position.set(-8, 10, -6);
    this.scene.add(fill);

    this.mats = createMaterials();
    this.level = buildLevel(this.scene, this.mats);

    this.playerChar = new Soldier("operative", this.mats);
    this.guardChar = new Soldier("sentry", this.mats);
    this.scene.add(this.playerChar.root);
    this.scene.add(this.guardChar.root);

    const coneGeo = new THREE.CircleGeometry(1, 22, -VISION_HALF, VISION_HALF * 2);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.rotateY(-Math.PI / 2);
    this.cone = new THREE.Mesh(coneGeo, this.mats.coneClear);
    this.cone.position.y = 0.03;
    this.scene.add(this.cone);

    this.bangTex = makeMarkTexture("!", "#c45c4a");
    this.qTex = makeMarkTexture("?", "#c4b15a");
    this.markMat = new THREE.SpriteMaterial({
      map: this.bangTex,
      depthTest: false,
      transparent: true,
    });
    this.mark = new THREE.Sprite(this.markMat);
    this.mark.scale.set(0.7, 0.7, 1);
    this.scene.add(this.mark);

    this.boxWorn = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.72, 0.78), this.mats.cardboard);
    body.position.y = 0.36;
    body.castShadow = true;
    this.boxWorn.add(body);
    this.boxWorn.visible = false;
    this.scene.add(this.boxWorn);

    const size = this.size();
    this.crt = new CrtPass(size.w, size.h);
    this.resize();

    this.onResize = () => this.resize();
    this.onVis = () => {
      if (!document.hidden) this.audio.resume();
    };
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVis);

    this.wireControlsTest();
    this.syncHud(true);
  }

  private size() {
    const parent = this.canvas.parentElement ?? this.canvas;
    const w = Math.max(16, parent.clientWidth);
    const h = Math.max(16, parent.clientHeight);
    return { w, h };
  }

  private resize() {
    const { w, h } = this.size();
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    this.crt.resize(Math.floor(w * pr), Math.floor(h * pr));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.loop();
  }

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    dt = Math.min(dt, 0.1);
    this.acc += dt;
    const actions = this.input.sample();
    if (actions.pausePressed) {
      if (this.sim.phase === "play") this.sim.phase = "pause";
      else if (this.sim.phase === "pause") this.sim.phase = "play";
    }
    if (this.sim.phase === "title" && actions.interactPressed) {
      this.begin();
    }
    let steps = 0;
    while (this.acc >= FIXED && steps < 5) {
      stepSim(this.sim, FIXED, actions, this.audio);
      this.acc -= FIXED;
      steps++;
      actions.interactPressed = false;
      actions.pausePressed = false;
    }
    this.present(dt);
  };

  private present(dt: number) {
    const s = this.sim;
    const p = s.player;
    const g = s.guard;

    this.playerChar.root.position.set(p.x, 0, p.z);
    this.playerChar.setVisible(!p.inBox);
    this.playerChar.update(dt, p.inBox ? "idle" : p.stance, p.yaw, p.speed > 0.25 && !p.inBox);

    this.guardChar.root.position.set(g.x, 0, g.z);
    this.guardChar.update(dt, g.stance, g.yaw, g.speed > 0.25);

    const range = coneRange(s);
    this.cone.scale.set(range, range, 1);
    this.cone.position.set(g.x, 0.03, g.z);
    this.cone.rotation.y = g.yaw;
    this.cone.material =
      s.alertLevel === "alert"
        ? this.mats.coneAlert
        : s.alertLevel === "caution"
          ? this.mats.coneCaution
          : this.mats.coneClear;

    this.mark.position.set(g.x, 2.15, g.z);
    if (s.alertLevel === "alert") {
      this.mark.visible = true;
      this.markMat.map = this.bangTex;
      this.markMat.needsUpdate = true;
      this.mark.position.y = 2.15 + Math.sin(s.time * 8) * 0.05;
    } else if (s.alertLevel === "caution") {
      this.mark.visible = true;
      this.markMat.map = this.qTex;
      this.markMat.needsUpdate = true;
    } else {
      this.mark.visible = false;
    }

    this.level.tape.visible = !s.tapeTaken;
    if (this.level.tape.visible) {
      this.level.tape.position.y = 0.86 + Math.sin(s.time * 2.2) * 0.04;
      this.level.tape.rotation.y = s.time * 0.6;
    }

    this.level.box.visible = !s.boxWorld.taken;
    this.level.box.position.set(s.boxWorld.x, 0, s.boxWorld.z);

    this.boxWorn.visible = p.inBox;
    if (p.inBox) {
      this.boxWorn.position.set(p.x, 0, p.z);
      this.boxWorn.rotation.y = p.yaw;
      this.boxWorn.position.y = Math.abs(Math.sin(s.time * (p.speed > 0.2 ? 8 : 1.2))) * 0.02;
    }

    this.level.survCam.rotation.y = -2.2 + Math.sin(s.time * 0.35) * 0.45;

    const follow = s.phase === "play" || s.phase === "pause" ? 0.28 : 0.08;
    const tx = p.x * follow + (s.phase === "title" ? Math.sin(s.time * 0.12) * 0.8 : 0);
    const tz = p.z * 0.22 - 0.6 + (s.phase === "title" ? Math.cos(s.time * 0.1) * 0.4 : 0);
    this.camTarget.set(tx, 0.35, tz);
    const desired = this.tmp.set(tx, 20.5, tz + 15.1);
    const shake = s.trauma * s.trauma;
    if (shake > 0.01) {
      desired.x += (Math.random() - 0.5) * shake * 0.35;
      desired.z += (Math.random() - 0.5) * shake * 0.25;
    }
    const k = 1 - Math.exp(-3.2 * dt);
    this.camPos.lerp(desired, k);
    this.look.lerp(this.camTarget, k);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.look);

    this.crt.render(this.renderer, this.scene, this.camera, s.time);

    this.hudClock += dt;
    if (this.hudClock > 0.08) {
      this.hudClock = 0;
      this.syncHud(false);
    }
  }

  private syncHud(force: boolean) {
    const s = this.sim;
    useHud.getState().set({
      ready: true,
      phase: s.phase,
      stance: s.player.stance,
      sneakOn: this.input.getSneakLatch() || s.player.stance === "stealth",
      inBox: s.player.inBox,
      hasTape: s.hasTape,
      actionHint: s.actionHint,
      alertLevel: s.alertLevel,
      suspicion: s.guard.suspicion,
      muted: this.audio.muted,
      radar: {
        player: { x: s.player.x, z: s.player.z, yaw: s.player.yaw },
        guard: { x: s.guard.x, z: s.guard.z, yaw: s.guard.yaw },
        tape: { x: TAPE_POS.x, z: TAPE_POS.z, taken: s.tapeTaken },
        box: { x: s.boxWorld.x, z: s.boxWorld.z, taken: s.boxWorld.taken },
        cone: coneRange(s),
      },
    });
    void force;
  }

  begin() {
    this.audio.unlock();
    this.audio.begin();
    if (this.sim.phase === "title" || this.sim.phase === "caught" || this.sim.phase === "win") {
      resetSim(this.sim);
    } else if (this.sim.phase === "pause") {
      this.sim.phase = "play";
    }
    this.syncHud(true);
  }

  resume() {
    if (this.sim.phase === "pause") this.sim.phase = "play";
    this.syncHud(true);
  }

  retry() {
    this.audio.unlock();
    resetSim(this.sim);
    this.syncHud(true);
  }

  toggleMute() {
    this.audio.unlock();
    this.audio.setMuted(!this.audio.muted);
    this.syncHud(true);
  }

  private wireControlsTest() {
    window.__controlsTest = {
      getYaw: () => this.sim.player.yaw,
      getSpeed: () => this.sim.player.speed,
      setKeys: (codes: string[]) => {
        if (this.sim.phase !== "play") {
          this.audio.unlock();
          resetSim(this.sim);
        }
        this.input.setKeys(codes);
      },
    };
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVis);
    this.input.dispose();
    this.crt.dispose();
    this.markMat.dispose();
    disposeMaterials(this.mats);
    this.bangTex.dispose();
    this.qTex.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
    this.renderer.dispose();
    delete window.__controlsTest;
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
    };
  }
}
