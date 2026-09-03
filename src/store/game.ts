import { create } from "zustand";
import type { AlertLevel, Phase } from "@/game/sim";
import type { Stance } from "@/game/soldier";

export type RadarBlip = {
  player: { x: number; z: number; yaw: number };
  guard: { x: number; z: number; yaw: number };
  tape: { x: number; z: number; taken: boolean };
  box: { x: number; z: number; taken: boolean };
  cone: number;
};

export type Hud = {
  ready: boolean;
  phase: Phase;
  stance: Stance;
  sneakOn: boolean;
  inBox: boolean;
  hasTape: boolean;
  actionHint: string | null;
  alertLevel: AlertLevel;
  suspicion: number;
  area: string;
  muted: boolean;
  radar: RadarBlip;
  set: (p: Partial<Hud>) => void;
};

const radar0: RadarBlip = {
  player: { x: 0.6, z: 6.4, yaw: 0 },
  guard: { x: -9.4, z: -1.6, yaw: 0 },
  tape: { x: 0.15, z: -8.15, taken: false },
  box: { x: 3.55, z: 4.35, taken: false },
  cone: 8.4,
};

export const useHud = create<Hud>((set) => ({
  ready: false,
  phase: "title",
  stance: "idle",
  sneakOn: false,
  inBox: false,
  hasTape: false,
  actionHint: null,
  alertLevel: "clear",
  suspicion: 0,
  area: "RECORDS ANNEX",
  muted: false,
  radar: radar0,
  set: (p) => set(p),
}));
