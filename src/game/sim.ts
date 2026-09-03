import {
  PLAYER_RADIUS,
  GUARD_RADIUS,
  SPEED_WALK,
  SPEED_RUN,
  SPEED_SNEAK,
  SPEED_BOX,
  ACCEL,
  GUARD_PATROL,
  GUARD_CHASE,
  VISION_RANGE,
  VISION_RANGE_SNEAK,
  VISION_HALF,
  HEAR_RUN,
  CATCH_DIST,
  PLAYER_START,
  GUARD_START,
  TAPE_POS,
  BOX_POS,
  EXTRACT,
  SOLIDS,
  PATROL,
} from "./constants";
import {
  resolveCircle,
  lineOfSight,
  dist2,
  angleDiff,
  wrapAngle,
  inRect,
  clamp,
} from "./collision";
import type { Stance } from "./soldier";
import type { Actions } from "./input";
import type { AudioSys } from "./audio";

export type AlertLevel = "clear" | "caution" | "alert";
export type Phase = "title" | "play" | "pause" | "caught" | "win";

export type SimState = {
  phase: Phase;
  player: {
    x: number;
    z: number;
    yaw: number;
    vx: number;
    vz: number;
    stance: Stance;
    inBox: boolean;
    speed: number;
  };
  guard: {
    x: number;
    z: number;
    yaw: number;
    stance: Stance;
    waypoint: number;
    dwell: number;
    suspicion: number;
    alert: number;
    searching: number;
    speed: number;
  };
  hasTape: boolean;
  tapeTaken: boolean;
  boxWorld: { x: number; z: number; taken: boolean };
  actionHint: string | null;
  alertLevel: AlertLevel;
  trauma: number;
  footTimer: number;
  time: number;
};

export function createSim(): SimState {
  return {
    phase: "title",
    player: {
      x: PLAYER_START.x,
      z: PLAYER_START.z,
      yaw: PLAYER_START.yaw,
      vx: 0,
      vz: 0,
      stance: "idle",
      inBox: false,
      speed: 0,
    },
    guard: {
      x: GUARD_START.x,
      z: GUARD_START.z,
      yaw: GUARD_START.yaw,
      stance: "idle",
      waypoint: 0,
      dwell: PATROL[0]?.dwell ?? 1,
      suspicion: 0,
      alert: 0,
      searching: 0,
      speed: 0,
    },
    hasTape: false,
    tapeTaken: false,
    boxWorld: { x: BOX_POS.x, z: BOX_POS.z, taken: false },
    actionHint: null,
    alertLevel: "clear",
    trauma: 0,
    footTimer: 0,
    time: 0,
  };
}

function forwardYaw(yaw: number) {
  return { fx: -Math.sin(yaw), fz: -Math.cos(yaw) };
}

function canSee(sim: SimState) {
  const g = sim.guard;
  const p = sim.player;
  const dx = p.x - g.x;
  const dz = p.z - g.z;
  const dist = Math.hypot(dx, dz);
  const range = p.stance === "stealth" || p.inBox ? VISION_RANGE_SNEAK : VISION_RANGE;
  if (dist > range || dist < 0.05) return { seen: false, dist };
  if (p.inBox) {
    const { fx, fz } = forwardYaw(g.yaw);
    const ang = Math.acos(clamp((fx * dx + fz * dz) / dist, -1, 1));
    const close = dist < 1.25 && ang < 0.32;
    return { seen: close, dist };
  }
  const { fx, fz } = forwardYaw(g.yaw);
  const ang = Math.acos(clamp((fx * dx + fz * dz) / dist, -1, 1));
  const half = p.stance === "stealth" ? VISION_HALF * 0.78 : VISION_HALF;
  if (ang > half) return { seen: false, dist };
  const eye = p.stance === "stealth" ? 0.95 : 1.45;
  if (!lineOfSight(g.x, g.z, p.x, p.z, SOLIDS, eye)) return { seen: false, dist };
  return { seen: true, dist };
}

function near(ax: number, az: number, bx: number, bz: number, r: number) {
  return dist2(ax, az, bx, bz) < r * r;
}

export function resetSim(sim: SimState) {
  const n = createSim();
  n.phase = "play";
  Object.assign(sim, n);
}

export function stepSim(sim: SimState, dt: number, actions: Actions, audio: AudioSys) {
  sim.time += dt;
  sim.trauma = Math.max(0, sim.trauma - dt * 1.6);

  if (sim.phase === "title") {
    idleGuard(sim, dt);
    return;
  }
  if (sim.phase !== "play") return;

  stepPlayer(sim, dt, actions, audio);
  stepGuard(sim, dt, audio);
  stepInteract(sim, actions, audio);
  stepAlerts(sim, audio);

  if (sim.hasTape && inRect(sim.player.x, sim.player.z, EXTRACT, 0.1)) {
    sim.phase = "win";
    audio.win();
  }
}

function stepPlayer(sim: SimState, dt: number, actions: Actions, audio: AudioSys) {
  const p = sim.player;
  const moving = Math.hypot(actions.moveX, actions.moveY) > 0.08;
  let stance: Stance = "idle";
  let max = 0;
  if (p.inBox) {
    stance = moving ? "walk" : "idle";
    max = SPEED_BOX;
  } else if (actions.sneak) {
    stance = moving ? "stealth" : "stealth";
    max = SPEED_SNEAK;
  } else if (actions.run && moving) {
    stance = "run";
    max = SPEED_RUN;
  } else if (moving) {
    stance = "walk";
    max = SPEED_WALK;
  } else {
    stance = "idle";
    max = 0;
  }
  p.stance = stance;

  // Camera-relative: +Y (W) is world -Z, +X (D) is world +X
  const ax = actions.moveX;
  const az = -actions.moveY;
  const wantX = ax * max;
  const wantZ = az * max;
  p.vx += (wantX - p.vx) * Math.min(1, dt * ACCEL);
  p.vz += (wantZ - p.vz) * Math.min(1, dt * ACCEL);
  if (!moving) {
    p.vx *= Math.max(0, 1 - dt * 10);
    p.vz *= Math.max(0, 1 - dt * 10);
  }

  const nx = p.x + p.vx * dt;
  const nz = p.z + p.vz * dt;
  const r = resolveCircle(nx, nz, PLAYER_RADIUS, SOLIDS);
  p.x = r.x;
  p.z = r.z;
  p.speed = Math.hypot(p.vx, p.vz);

  if (p.speed > 0.25) {
    const wantYaw = Math.atan2(-p.vx, -p.vz);
    const d = angleDiff(wantYaw, p.yaw);
    p.yaw = wrapAngle(p.yaw + d * Math.min(1, dt * 10));
  }

  if (p.speed > 0.4) {
    sim.footTimer -= dt;
    if (sim.footTimer <= 0) {
      sim.footTimer = stance === "run" ? 0.28 : stance === "stealth" ? 0.55 : 0.42;
      audio.foot(stance === "stealth" || p.inBox);
    }
  }
}

function idleGuard(sim: SimState, dt: number) {
  const g = sim.guard;
  g.stance = "idle";
  g.yaw = wrapAngle(g.yaw + Math.sin(sim.time * 0.4) * dt * 0.15);
}

function stepGuard(sim: SimState, dt: number, _audio: AudioSys) {
  const g = sim.guard;
  const p = sim.player;
  const vision = canSee(sim);
  const dPlayer = Math.hypot(p.x - g.x, p.z - g.z);

  if (vision.seen) {
    g.suspicion = Math.min(1, g.suspicion + dt * (p.inBox ? 0.35 : 1.8));
    if (g.suspicion > 0.55) g.alert = 1;
  } else {
    g.suspicion = Math.max(0, g.suspicion - dt * 0.18);
  }

  const heard = p.stance === "run" && dPlayer < HEAR_RUN && !p.inBox;
  if (heard) g.suspicion = Math.min(1, g.suspicion + dt * 0.7);

  if (g.alert > 0) {
    g.alert = Math.max(0, g.alert - (vision.seen ? 0 : dt * 0.12));
    g.searching = vision.seen ? 3.5 : Math.max(0, g.searching - dt);
    const tx = vision.seen || g.searching > 0 ? p.x : PATROL[g.waypoint]?.x ?? g.x;
    const tz = vision.seen || g.searching > 0 ? p.z : PATROL[g.waypoint]?.z ?? g.z;
    moveGuardToward(sim, dt, tx, tz, GUARD_CHASE);
    g.stance = g.speed > 0.3 ? "run" : "idle";
    if (dPlayer < CATCH_DIST && !p.inBox) {
      sim.phase = "caught";
      sim.trauma = 1;
    }
    return;
  }

  if (g.suspicion > 0.25) {
    const tx = p.x;
    const tz = p.z;
    moveGuardToward(sim, dt, tx, tz, GUARD_PATROL * 1.15);
    g.stance = g.speed > 0.2 ? "walk" : "idle";
    return;
  }

  const wp = PATROL[g.waypoint] ?? PATROL[0];
  if (!wp) return;
  const d = Math.hypot(wp.x - g.x, wp.z - g.z);
  if (d < 0.35) {
    g.dwell -= dt;
    g.stance = "idle";
    g.speed = 0;
    g.yaw = wrapAngle(g.yaw + dt * 0.5);
    if (g.dwell <= 0) {
      g.waypoint = (g.waypoint + 1) % PATROL.length;
      g.dwell = PATROL[g.waypoint]?.dwell ?? 1;
    }
  } else {
    moveGuardToward(sim, dt, wp.x, wp.z, GUARD_PATROL);
    g.stance = "walk";
  }
}

function moveGuardToward(sim: SimState, dt: number, tx: number, tz: number, speed: number) {
  const g = sim.guard;
  const dx = tx - g.x;
  const dz = tz - g.z;
  const d = Math.hypot(dx, dz) || 1;
  const wantYaw = Math.atan2(-dx, -dz);
  const ad = angleDiff(wantYaw, g.yaw);
  g.yaw = wrapAngle(g.yaw + clamp(ad, -2.6 * dt, 2.6 * dt));
  const { fx, fz } = forwardYaw(g.yaw);
  const step = speed * dt;
  const pos = resolveCircle(g.x + fx * step, g.z + fz * step, GUARD_RADIUS, SOLIDS);
  g.x = pos.x;
  g.z = pos.z;
  g.speed = speed;
}

function stepInteract(sim: SimState, actions: Actions, audio: AudioSys) {
  const p = sim.player;
  sim.actionHint = null;

  if (!sim.tapeTaken && near(p.x, p.z, TAPE_POS.x, TAPE_POS.z, 1.15)) {
    sim.actionHint = "RETRIEVE TAPE";
    if (actions.interactPressed) {
      sim.tapeTaken = true;
      sim.hasTape = true;
      audio.pickup();
    }
  }

  if (p.inBox) {
    sim.actionHint = "DROP BOX";
    if (actions.interactPressed) {
      p.inBox = false;
      sim.boxWorld.taken = false;
      sim.boxWorld.x = p.x;
      sim.boxWorld.z = p.z;
      audio.box();
    }
    return;
  }

  if (!sim.boxWorld.taken && near(p.x, p.z, sim.boxWorld.x, sim.boxWorld.z, 1.2)) {
    sim.actionHint = "ENTER BOX";
    if (actions.interactPressed) {
      p.inBox = true;
      sim.boxWorld.taken = true;
      audio.box();
    }
  }

  if (sim.hasTape && inRect(p.x, p.z, EXTRACT, 0.4)) {
    sim.actionHint = "EXTRACT";
  }
}

function stepAlerts(sim: SimState, audio: AudioSys) {
  const prev = sim.alertLevel;
  if (sim.guard.alert > 0.15) sim.alertLevel = "alert";
  else if (sim.guard.suspicion > 0.22) sim.alertLevel = "caution";
  else sim.alertLevel = "clear";

  if (prev !== "alert" && sim.alertLevel === "alert") {
    audio.alert();
    sim.trauma = 0.85;
  } else if (prev === "clear" && sim.alertLevel === "caution") {
    audio.caution();
    sim.trauma = 0.35;
  }
}

export function coneRange(sim: SimState) {
  return sim.player.stance === "stealth" || sim.player.inBox ? VISION_RANGE_SNEAK : VISION_RANGE;
}
