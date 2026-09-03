export const PLAYER_RADIUS = 0.38;
export const GUARD_RADIUS = 0.4;
export const WALL_H = 1.38;
export const SHELF_H = 1.08;

export const SPEED_WALK = 1.62;
export const SPEED_RUN = 3.22;
export const SPEED_SNEAK = 0.88;
export const SPEED_BOX = 0.72;
export const ACCEL = 14;
export const TURN_SNAP = 12;

export const GUARD_PATROL = 0.92;
export const GUARD_CHASE = 2.28;
export const VISION_RANGE = 8.4;
export const VISION_RANGE_SNEAK = 5.2;
export const VISION_HALF = (52 * Math.PI) / 180 / 2;
export const HEAR_RUN = 6.4;
export const CATCH_DIST = 1.05;

export const PLAYER_START = { x: 0.6, z: 6.4, yaw: 0 };
export const GUARD_START = { x: -9.4, z: -1.6, yaw: Math.PI / 2 };
export const TAPE_POS = { x: 0.15, z: -8.15 };
export const BOX_POS = { x: 3.55, z: 4.35 };

export const EXTRACT = { minX: -3.2, maxX: 3.4, minZ: 6.6, maxZ: 8.4 };

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number; h?: number };

/** Collision solids (walls + cover). Door gap is simply omitted. */
export const SOLIDS: Rect[] = [
  // Main hall outer
  { minX: -6.0, maxX: 6.9, minZ: 8.35, maxZ: 8.85 }, // south
  { minX: -6.0, maxX: 6.9, minZ: -9.85, maxZ: -9.35 }, // north
  { minX: 6.45, maxX: 6.95, minZ: -9.85, maxZ: 8.85 }, // east
  // Shared west wall of hall, with doorway z=-2.35..0.55
  { minX: -6.0, maxX: -5.5, minZ: 0.55, maxZ: 8.85 },
  { minX: -6.0, maxX: -5.5, minZ: -9.85, maxZ: -2.35 },
  // West office outer
  { minX: -13.35, maxX: -12.85, minZ: -6.85, maxZ: 2.85 }, // west
  { minX: -13.35, maxX: -5.5, minZ: 2.35, maxZ: 2.85 }, // south of office
  { minX: -13.35, maxX: -5.5, minZ: -6.85, maxZ: -6.35 }, // north of office
  // Cover / furniture
  { minX: 2.55, maxX: 4.85, minZ: 0.05, maxZ: 2.55, h: SHELF_H }, // east shelves
  { minX: -3.65, maxX: -1.45, minZ: -4.85, maxZ: -3.45, h: SHELF_H }, // hall shelf
  { minX: 0.15, maxX: 0.55, minZ: 0.85, maxZ: 4.35, h: 1.22 }, // partition
  { minX: -1.7, maxX: 1.85, minZ: -9.25, maxZ: -7.95, h: 0.78 }, // north desk
  { minX: 4.55, maxX: 6.25, minZ: -8.55, maxZ: -6.55, h: SHELF_H }, // NE cabinets
  { minX: -12.55, maxX: -10.15, minZ: -5.85, maxZ: -4.15, h: SHELF_H }, // office cabinets
  { minX: -8.35, maxX: -6.35, minZ: 0.55, maxZ: 2.05, h: 0.74 }, // office desk
];

export const FLOORS: Rect[] = [
  { minX: -5.75, maxX: 6.7, minZ: -9.6, maxZ: 8.6 },
  { minX: -13.1, maxX: -5.5, minZ: -6.6, maxZ: 2.6 },
];

export const PATROL: { x: number; z: number; dwell: number }[] = [
  { x: -9.5, z: -1.4, dwell: 1.8 },
  { x: -9.6, z: -4.8, dwell: 2.4 },
  { x: -9.5, z: -1.4, dwell: 0.4 },
  { x: -6.6, z: -0.9, dwell: 0.6 },
  { x: -3.2, z: -0.7, dwell: 2.2 },
  { x: -6.6, z: -0.9, dwell: 0.4 },
];

export const COLORS = {
  bg: 0x8e978a,
  floor: 0x6d7668,
  floorAlt: 0x646d60,
  wall: 0x7b8476,
  wallTop: 0x8a9386,
  trim: 0x4e564c,
  shelf: 0x5c5648,
  metal: 0x4a524c,
  desk: 0x4a4034,
  cardboard: 0xb08a52,
  tape: 0x2a2e28,
  operative: 0x1a2420,
  operativeAccent: 0x2c3830,
  sentry: 0x5c6b50,
  sentryDark: 0x3e4838,
  skin: 0xc4a07a,
  helmet: 0x3a4238,
  visor: 0x151c16,
  bandana: 0x2a332c,
  boot: 0x121614,
} as const;
