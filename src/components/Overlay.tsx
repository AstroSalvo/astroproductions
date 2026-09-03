import { Radar } from "./Radar";
import { TouchPad } from "./TouchPad";
import { useHud } from "@/store/game";

type Props = {
  onBegin: () => void;
  onResume: () => void;
  onRetry: () => void;
  onMute: () => void;
  onTouchMove: (x: number, y: number) => void;
  onTouchRun: (v: boolean) => void;
  onTouchSneak: () => void;
  onTouchAct: () => void;
};

export function Overlay({
  onBegin,
  onResume,
  onRetry,
  onMute,
  onTouchMove,
  onTouchRun,
  onTouchSneak,
  onTouchAct,
}: Props) {
  const hud = useHud();
  const { phase } = hud;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-fg">
      <div
        className={`absolute inset-0 transition-opacity duration-[var(--motion-slow)] ${
          hud.alertLevel === "alert"
            ? "bg-alert/15"
            : hud.alertLevel === "caution"
              ? "bg-caution/10"
              : "bg-transparent"
        }`}
      />

      {phase === "play" || phase === "pause" ? (
        <>
          <header className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3 md:top-5 md:left-5 md:right-5">
            <div className="hud-panel pointer-events-auto rounded-md px-3 py-2 md:px-4 md:py-3">
              <p className="font-display text-lg font-semibold tracking-[0.28em] text-olive md:text-2xl">
                RESIDUO
              </p>
              <p className="font-mono text-[10px] tracking-[0.22em] text-fg-muted md:text-xs">
                {hud.area}
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-widest text-fg">
                STANCE{" "}
                <span className="text-olive">
                  {hud.inBox ? "BOX" : hud.stance === "stealth" ? "SNEAK" : hud.stance.toUpperCase()}
                </span>
              </p>
              <button
                type="button"
                className="mt-2 font-mono text-[10px] tracking-widest text-fg-subtle hover:text-fg"
                onClick={onMute}
              >
                {hud.muted ? "SOUND OFF" : "SOUND ON"}
              </button>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Radar data={hud.radar} alert={hud.alertLevel} />
              <p
                className={`font-display text-sm tracking-[0.4em] ${
                  hud.alertLevel === "alert"
                    ? "text-alert alert-pulse animate-[alert-pulse_0.6s_ease-in-out_infinite]"
                    : hud.alertLevel === "caution"
                      ? "text-caution caution-pulse animate-[caution-pulse_1.2s_ease-in-out_infinite]"
                      : "text-codec"
                }`}
              >
                {hud.alertLevel === "alert"
                  ? "ALERT"
                  : hud.alertLevel === "caution"
                    ? "CAUTION"
                    : "CLEAR"}
              </p>
            </div>
          </header>

          <div className="absolute bottom-24 left-3 hidden md:block md:bottom-6 md:left-5">
            <div className="hud-panel rounded-md px-3 py-2 font-mono text-[11px] tracking-wider text-fg-muted">
              <p>WASD MOVE</p>
              <p>SHIFT RUN · C SNEAK · E ACT</p>
              <p>ESC PAUSE</p>
            </div>
          </div>

          <div className="absolute bottom-24 right-3 md:bottom-6 md:right-5">
            <div className="hud-panel rounded-md px-3 py-2 font-mono text-[11px] tracking-widest">
              <p className="text-fg-muted">TAPE</p>
              <p className={hud.hasTape ? "text-codec" : "text-fg-subtle"}>
                {hud.hasTape ? "SECURED" : "NOT FOUND"}
              </p>
            </div>
          </div>

          {hud.actionHint ? (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 md:bottom-10">
              <div className="hud-panel rounded-md px-4 py-2 font-mono text-xs tracking-[0.28em] text-olive">
                E · {hud.actionHint}
              </div>
            </div>
          ) : null}

          <TouchPad
            onMove={onTouchMove}
            onRun={onTouchRun}
            onSneak={onTouchSneak}
            onAct={onTouchAct}
            sneakOn={hud.sneakOn}
          />
        </>
      ) : null}

      {phase === "title" ? <Title onBegin={onBegin} onMute={onMute} muted={hud.muted} /> : null}
      {phase === "pause" ? (
        <Modal
          kicker="PAUSED"
          title="HOLD POSITION"
          body="The annex is still live. Resume when ready."
          action="RESUME"
          onAction={onResume}
          secondary="ABORT"
          onSecondary={onRetry}
        />
      ) : null}
      {phase === "caught" ? (
        <Modal
          kicker="CONTACT"
          title="YOU WERE SEEN"
          body="The sentry closed the distance. Reload from the south entrance."
          action="RETRY"
          onAction={onRetry}
        />
      ) : null}
      {phase === "win" ? (
        <Modal
          kicker="EXTRACTION"
          title="TAPE SECURED"
          body="The records leave with you. The annex goes dark."
          action="AGAIN"
          onAction={onRetry}
        />
      ) : null}
    </div>
  );
}

function Title({
  onBegin,
  onMute,
  muted,
}: {
  onBegin: () => void;
  onMute: () => void;
  muted: boolean;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/45 px-4">
      <div className="hud-panel w-full max-w-lg rounded-lg px-6 py-7 md:px-10 md:py-9">
        <p className="font-mono text-[11px] tracking-[0.42em] text-olive">SITE 4 · CODEC</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-[0.22em] text-fg md:text-7xl">
          RESIDUO
        </h1>
        <p className="mt-1 font-display text-lg tracking-[0.32em] text-fg-muted">
          COVERT INFILTRATION
        </p>
        <div className="mt-5 space-y-2 font-mono text-xs leading-relaxed tracking-wide text-fg-muted md:text-sm">
          <p>HANDLER — The tape is on the north desk.</p>
          <p>A sentry holds the west office. Stay out of the cone.</p>
          <p>Use the box. Extract south when the tape is yours.</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBegin}
            className="min-h-11 rounded-md bg-olive px-6 font-display text-lg tracking-[0.28em] text-bg transition-transform duration-[var(--motion-quick)] hover:brightness-110 active:scale-[0.98]"
          >
            BEGIN
          </button>
          <button
            type="button"
            onClick={onMute}
            className="min-h-11 rounded-md border border-border px-4 font-mono text-xs tracking-widest text-fg-muted"
          >
            {muted ? "SOUND OFF" : "SOUND ON"}
          </button>
        </div>
        <p className="mt-5 font-mono text-[10px] tracking-wider text-fg-subtle">
          WASD MOVE · SHIFT RUN · C SNEAK · E ACTION
        </p>
      </div>
    </div>
  );
}

function Modal({
  kicker,
  title,
  body,
  action,
  onAction,
  secondary,
  onSecondary,
}: {
  kicker: string;
  title: string;
  body: string;
  action: string;
  onAction: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/55 px-4">
      <div className="hud-panel w-full max-w-md rounded-lg px-6 py-7">
        <p className="font-mono text-[11px] tracking-[0.4em] text-olive">{kicker}</p>
        <h2 className="mt-2 font-display text-4xl tracking-[0.18em]">{title}</h2>
        <p className="mt-3 font-mono text-sm leading-relaxed text-fg-muted">{body}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onAction}
            className="min-h-11 rounded-md bg-olive px-5 font-display text-lg tracking-[0.24em] text-bg active:scale-[0.98]"
          >
            {action}
          </button>
          {secondary && onSecondary ? (
            <button
              type="button"
              onClick={onSecondary}
              className="min-h-11 rounded-md border border-border px-4 font-mono text-xs tracking-widest text-fg-muted"
            >
              {secondary}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
