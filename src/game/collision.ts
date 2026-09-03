import { type Rect, PLAYER_RADIUS, FLOORS } from "./constants";

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function resolveCircle(x: number, z: number, r: number, solids: Rect[]) {
  let px = x;
  let pz = z;
  for (let i = 0; i < 3; i++) {
    for (const b of solids) {
      const cx = clamp(px, b.minX, b.maxX);
      const cz = clamp(pz, b.minZ, b.maxZ);
      let dx = px - cx;
      let dz = pz - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 < 1e-8) {
        const left = Math.abs(px - b.minX);
        const right = Math.abs(b.maxX - px);
        const up = Math.abs(pz - b.minZ);
        const down = Math.abs(b.maxZ - pz);
        const m = Math.min(left, right, up, down);
        if (m === left) px = b.minX - r;
        else if (m === right) px = b.maxX + r;
        else if (m === up) pz = b.minZ - r;
        else pz = b.maxZ + r;
        continue;
      }
      const d = Math.sqrt(d2);
      const push = (r - d) / d;
      px += dx * push;
      pz += dz * push;
    }
  }
  return { x: px, z: pz };
}

export function insideFloor(x: number, z: number, pad = 0.2) {
  for (const f of FLOORS) {
    if (x > f.minX + pad && x < f.maxX - pad && z > f.minZ + pad && z < f.maxZ - pad) {
      return true;
    }
  }
  return false;
}

export function inRect(x: number, z: number, r: Rect, pad = 0) {
  return x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad;
}

/** Segment vs AABB (XZ), true if blocked. */
export function rayHits(x1: number, z1: number, x2: number, z2: number, b: Rect) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number) => {
    if (Math.abs(p) < 1e-9) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  if (!clip(-dx, x1 - b.minX)) return false;
  if (!clip(dx, b.maxX - x1)) return false;
  if (!clip(-dz, z1 - b.minZ)) return false;
  if (!clip(dz, b.maxZ - z1)) return false;
  return t0 < t1 && t1 >= 0 && t0 <= 1;
}

export function lineOfSight(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  solids: Rect[],
  eyeH = 1.45,
) {
  for (const b of solids) {
    const h = b.h ?? 1.4;
    if (h + 0.05 < eyeH) continue;
    if (rayHits(x1, z1, x2, z2, b)) return false;
  }
  return true;
}

export function dist2(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

export function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function circleRectDist(x: number, z: number, b: Rect) {
  const cx = clamp(x, b.minX, b.maxX);
  const cz = clamp(z, b.minZ, b.maxZ);
  return Math.hypot(x - cx, z - cz);
}

export { PLAYER_RADIUS };
