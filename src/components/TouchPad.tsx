import { useRef } from "react";

type Props = {
  onMove: (x: number, y: number) => void;
  onRun: (v: boolean) => void;
  onSneak: () => void;
  onAct: () => void;
  sneakOn: boolean;
};

export function TouchPad({ onMove, onRun, onSneak, onAct, sneakOn }: Props) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2, id: e.pointerId };
    nudge(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!origin.current || origin.current.id !== e.pointerId) return;
    nudge(e.clientX, e.clientY);
  };
  const end = (e: React.PointerEvent) => {
    if (origin.current && origin.current.id === e.pointerId) {
      origin.current = null;
      onMove(0, 0);
    }
  };
  const nudge = (cx: number, cy: number) => {
    const o = origin.current;
    if (!o) return;
    const dx = (cx - o.x) / 48;
    const dy = (cy - o.y) / 48;
    let x = dx;
    let y = -dy;
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    onMove(x, y);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
      <div
        className="pointer-events-auto size-[118px] rounded-full border border-border bg-bg/55"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label="Move"
      >
        <div className="m-auto mt-[39px] size-10 rounded-full border border-olive/50" />
      </div>
      <div className="pointer-events-auto mb-1 flex flex-col gap-2">
        <PadBtn label="RUN" onDown={() => onRun(true)} onUp={() => onRun(false)} />
        <PadBtn label={sneakOn ? "SNEAK ON" : "SNEAK"} active={sneakOn} onDown={onSneak} />
        <PadBtn label="ACT" onDown={onAct} />
      </div>
    </div>
  );
}

function PadBtn({
  label,
  onDown,
  onUp,
  active,
}: {
  label: string;
  onDown: () => void;
  onUp?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`min-h-11 min-w-[92px] rounded-md border px-3 font-mono text-xs tracking-widest ${
        active
          ? "border-olive bg-olive/25 text-fg"
          : "border-border bg-bg/70 text-fg-muted"
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {label}
    </button>
  );
}
