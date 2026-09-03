import { useEffect, useRef, useState } from "react";
import { Overlay } from "./Overlay";
import type { GameEngine } from "@/game/engine";

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let engine: GameEngine | null = null;

    void import("@/game/engine").then(({ GameEngine }) => {
      if (disposed || !canvasRef.current) return;
      engine = new GameEngine(canvasRef.current);
      engineRef.current = engine;
      engine.start();
      setBooting(false);
    });

    return () => {
      disposed = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bezel">
      <div className="crt-bezel absolute inset-[6px] overflow-hidden rounded-[18px] md:inset-3 md:rounded-[22px]">
        <canvas ref={canvasRef} className="block h-full w-full" />
        <div className="crt-scanlines absolute inset-0" />
        <div className="crt-vignette absolute inset-0" />
        <div className="crt-glow absolute inset-0" />
        <Overlay
          onBegin={() => engineRef.current?.begin()}
          onResume={() => engineRef.current?.resume()}
          onRetry={() => engineRef.current?.retry()}
          onMute={() => engineRef.current?.toggleMute()}
          onTouchMove={(x, y) => engineRef.current?.input.setTouchMove(x, y)}
          onTouchRun={(v) => engineRef.current?.input.setTouchRun(v)}
          onTouchSneak={() => engineRef.current?.input.toggleSneak()}
          onTouchAct={() => engineRef.current?.input.pulseInteract()}
        />
        {booting ? (
          <div className="absolute inset-0 flex items-center justify-center bg-bg">
            <p className="font-mono text-xs tracking-[0.4em] text-olive">BOOTING ANNEX…</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
