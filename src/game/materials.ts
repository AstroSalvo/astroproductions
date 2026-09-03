import * as THREE from "three";
import { COLORS } from "./constants";

function noise(x: number, y: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function canvasTex(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d");
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function makeFloorTex() {
  return canvasTex(512, (ctx, s) => {
    ctx.fillStyle = "#6d7668";
    ctx.fillRect(0, 0, s, s);
    const tile = 64;
    for (let y = 0; y < s; y += tile) {
      for (let x = 0; x < s; x += tile) {
        const n = noise(x * 0.17, y * 0.13);
        const g = 104 + n * 18;
        ctx.fillStyle = `rgb(${g - 6},${g},${g - 10})`;
        ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
        ctx.strokeStyle = "rgba(40,46,40,0.35)";
        ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
      }
    }
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 1200; i++) {
      ctx.fillRect(Math.random() * s, Math.random() * s, 1, 1);
    }
  });
}

export function makeWallTex() {
  return canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#7c8578";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * s;
      ctx.fillStyle = `rgba(0,0,0,${0.015 + (i % 3) * 0.01})`;
      ctx.fillRect(0, y, s, 3);
    }
    ctx.fillStyle = "rgba(90,70,50,0.05)";
    for (let i = 0; i < 30; i++) {
      ctx.fillRect(Math.random() * s, Math.random() * s, 18, 10);
    }
  });
}

export type MatLib = ReturnType<typeof createMaterials>;

export function createMaterials() {
  const floorMap = makeFloorTex();
  floorMap.repeat.set(12, 16);

  const wallMap = makeWallTex();
  wallMap.repeat.set(2, 1);

  const lambert = (color: number, extra?: THREE.MeshLambertMaterialParameters) =>
    new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

  const mats = {
    floor: new THREE.MeshLambertMaterial({
      map: floorMap,
      color: 0xd8ddd4,
      flatShading: true,
    }),
    wall: new THREE.MeshLambertMaterial({
      map: wallMap,
      color: 0xc8cec2,
      flatShading: true,
    }),
    wallTop: lambert(COLORS.wallTop),
    trim: lambert(COLORS.trim),
    shelf: lambert(COLORS.shelf),
    metal: lambert(COLORS.metal),
    desk: lambert(COLORS.desk),
    cardboard: lambert(COLORS.cardboard),
    tape: lambert(COLORS.tape),
    tapeReel: lambert(0x8a7a48),
    operative: lambert(COLORS.operative),
    operativeAccent: lambert(COLORS.operativeAccent),
    sentry: lambert(COLORS.sentry),
    sentryDark: lambert(COLORS.sentryDark),
    skin: lambert(COLORS.skin),
    helmet: lambert(COLORS.helmet),
    visor: lambert(COLORS.visor),
    bandana: lambert(COLORS.bandana),
    boot: lambert(COLORS.boot),
    lens: lambert(0x1a2420),
    caution: lambert(0xb8a24a),
    coneClear: new THREE.MeshBasicMaterial({
      color: 0x7dba6a,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    coneCaution: new THREE.MeshBasicMaterial({
      color: 0xc4b15a,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    coneAlert: new THREE.MeshBasicMaterial({
      color: 0xc45c4a,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    mark: new THREE.SpriteMaterial({ depthTest: false, transparent: true }),
    floorMap,
    wallMap,
  };
  return mats;
}

export function disposeMaterials(m: MatLib) {
  for (const v of Object.values(m)) {
    if (v && typeof v === "object" && "dispose" in v) (v as { dispose: () => void }).dispose();
  }
}

export function makeMarkTexture(text: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d");
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(64, 8);
  ctx.lineTo(120, 104);
  ctx.lineTo(8, 104);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#0c1210";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#0c1210";
  ctx.font = "bold 64px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 64, 78);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
