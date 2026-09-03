import { useEffect, useRef } from "react";
import type { RadarBlip } from "@/store/game";

const MAP = { minX: -13.4, maxX: 7.0, minZ: -9.9, maxZ: 8.9 };

export function Radar({ data, alert }: { data: RadarBlip; alert: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    const sx = (x: number) => ((x - MAP.minX) / (MAP.maxX - MAP.minX)) * w;
    const sy = (z: number) => ((z - MAP.minZ) / (MAP.maxZ - MAP.minZ)) * h;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(12,18,16,0.85)";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = "rgba(125,186,106,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(-5.8), sy(-9.6), sx(6.7) - sx(-5.8), sy(8.6) - sy(-9.6));
    ctx.strokeRect(sx(-13.1), sy(-6.6), sx(-5.5) - sx(-13.1), sy(2.6) - sy(-6.6));

    const g = data.guard;
    ctx.fillStyle =
      alert === "alert" ? "rgba(196,92,74,0.28)" : alert === "caution" ? "rgba(196,177,90,0.22)" : "rgba(125,186,106,0.16)";
    ctx.beginPath();
    ctx.moveTo(sx(g.x), sy(g.z));
    const half = 0.45;
    const r = 28;
    ctx.arc(sx(g.x), sy(g.z), r, -g.yaw - half - Math.PI / 2, -g.yaw + half - Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#c45c4a";
    ctx.beginPath();
    ctx.arc(sx(g.x), sy(g.z), 3.2, 0, Math.PI * 2);
    ctx.fill();

    if (!data.tape.taken) {
      ctx.fillStyle = "#c4b15a";
      ctx.fillRect(sx(data.tape.x) - 2, sy(data.tape.z) - 2, 4, 4);
    }

    const p = data.player;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.z));
    ctx.rotate(-p.yaw);
    ctx.fillStyle = "#7dba6a";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    ctx.strokeStyle = alert === "alert" ? "#c45c4a" : alert === "caution" ? "#c4b15a" : "#7dba6a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [data, alert]);

  return (
    <canvas
      ref={ref}
      width={148}
      height={148}
      className="size-24 rounded-full md:size-32"
      aria-label="Soliton radar"
    />
  );
}
