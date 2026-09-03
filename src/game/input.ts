export type Actions = {
  moveX: number;
  moveY: number;
  run: boolean;
  sneak: boolean;
  interact: boolean;
  interactPressed: boolean;
  pausePressed: boolean;
};

const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "KeyC",
  "KeyE",
  "Space",
  "Escape",
  "KeyP",
  "KeyR",
  "KeyM",
]);

export class Input {
  private keys = new Set<string>();
  private injected: string[] | null = null;
  private touchX = 0;
  private touchY = 0;
  private touchRun = false;
  private touchSneak = false;
  private touchAct = false;
  private prevInteract = false;
  private prevPause = false;
  private sneakLatch = false;
  private prevSneakHeld = false;

  constructor() {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", this.onDown);
    window.addEventListener("keyup", this.onUp);
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", this.onVis);
  }

  dispose() {
    window.removeEventListener("keydown", this.onDown);
    window.removeEventListener("keyup", this.onUp);
    window.removeEventListener("blur", this.clear);
    document.removeEventListener("visibilitychange", this.onVis);
  }

  setKeys(codes: string[]) {
    this.injected = codes;
  }

  clearInjected() {
    this.injected = null;
  }

  setTouchMove(x: number, y: number) {
    this.touchX = x;
    this.touchY = y;
  }

  setTouchRun(v: boolean) {
    this.touchRun = v;
  }

  setTouchSneak(v: boolean) {
    this.touchSneak = v;
  }

  pulseInteract() {
    this.touchAct = true;
  }

  toggleSneak() {
    this.sneakLatch = !this.sneakLatch;
  }

  getSneakLatch() {
    return this.sneakLatch;
  }

  private onDown = (e: KeyboardEvent) => {
    if (e.repeat) {
      if (GAME_CODES.has(e.code)) e.preventDefault();
      return;
    }
    this.keys.add(e.code);
    if (GAME_CODES.has(e.code)) e.preventDefault();
  };

  private onUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private clear = () => {
    this.keys.clear();
  };

  private onVis = () => {
    if (document.hidden) this.keys.clear();
  };

  private held(code: string) {
    if (this.injected) return this.injected.includes(code);
    return this.keys.has(code);
  }

  sample(): Actions {
    let x = this.touchX;
    let y = this.touchY;
    if (this.held("KeyA") || this.held("ArrowLeft")) x -= 1;
    if (this.held("KeyD") || this.held("ArrowRight")) x += 1;
    if (this.held("KeyW") || this.held("ArrowUp")) y += 1;
    if (this.held("KeyS") || this.held("ArrowDown")) y -= 1;

    const mag = Math.hypot(x, y);
    if (mag > 1) {
      x /= mag;
      y /= mag;
    } else if (mag < 0.18) {
      x = 0;
      y = 0;
    }

    const sneakHeld =
      this.held("KeyC") || this.held("ControlLeft") || this.held("ControlRight") || this.touchSneak;
    if (sneakHeld && !this.prevSneakHeld) this.sneakLatch = !this.sneakLatch;
    this.prevSneakHeld = sneakHeld;

    const interact = this.held("KeyE") || this.held("Space") || this.touchAct;
    const pause = this.held("Escape") || this.held("KeyP");
    const interactPressed = interact && !this.prevInteract;
    const pausePressed = pause && !this.prevPause;
    this.prevInteract = interact;
    this.prevPause = pause;
    this.touchAct = false;

    return {
      moveX: x,
      moveY: y,
      run: this.held("ShiftLeft") || this.held("ShiftRight") || this.touchRun,
      sneak: this.sneakLatch,
      interact,
      interactPressed,
      pausePressed,
    };
  }
}
