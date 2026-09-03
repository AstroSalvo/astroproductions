import * as THREE from "three";
import { COLORS, SOLIDS, FLOORS, WALL_H, SHELF_H, TAPE_POS, BOX_POS } from "./constants";
import type { MatLib } from "./materials";

function boxMesh(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function rectToBoxes(group: THREE.Group, mats: MatLib) {
  for (const r of SOLIDS) {
    const w = r.maxX - r.minX;
    const d = r.maxZ - r.minZ;
    const h = r.h ?? WALL_H;
    const x = (r.minX + r.maxX) / 2;
    const z = (r.minZ + r.maxZ) / 2;
    const isWall = !r.h || r.h >= WALL_H - 0.05;
    const mat = isWall ? mats.wall : r.h && r.h < 0.9 ? mats.desk : mats.shelf;
    const mesh = boxMesh(w, h, d, mat, x, h / 2, z);
    group.add(mesh);
    if (isWall) {
      const cap = boxMesh(w + 0.04, 0.06, d + 0.04, mats.wallTop, x, h + 0.02, z);
      cap.castShadow = false;
      group.add(cap);
    }
  }
}

export function buildLevel(scene: THREE.Scene, mats: MatLib) {
  const root = new THREE.Group();
  scene.add(root);

  for (const f of FLOORS) {
    const w = f.maxX - f.minX;
    const d = f.maxZ - f.minZ;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mats.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((f.minX + f.maxX) / 2, 0, (f.minZ + f.maxZ) / 2);
    floor.receiveShadow = true;
    root.add(floor);
  }

  rectToBoxes(root, mats);

  // Door frame
  const frameMat = mats.trim;
  root.add(boxMesh(0.18, 1.55, 0.18, frameMat, -5.75, 0.77, -2.35));
  root.add(boxMesh(0.18, 1.55, 0.18, frameMat, -5.75, 0.77, 0.55));
  root.add(boxMesh(0.18, 0.12, 3.1, frameMat, -5.75, 1.5, -0.9));

  // Baseboards
  const addBase = (x: number, z: number, w: number, d: number) => {
    root.add(boxMesh(w, 0.08, d, mats.trim, x, 0.04, z));
  };
  addBase(0.45, 8.5, 12.6, 0.08);
  addBase(6.62, -0.5, 0.08, 17.8);

  // Caution stripe on south floor
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.22), mats.caution);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0.4, 0.012, 7.35);
  stripe.receiveShadow = true;
  root.add(stripe);

  // Office chair (rounded)
  const chair = new THREE.Group();
  chair.position.set(-7.2, 0, 1.15);
  const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.04, 4, 8), mats.metal);
  seat.position.y = 0.42;
  seat.scale.set(1.3, 0.5, 1.2);
  chair.add(seat);
  const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.28, 4, 8), mats.metal);
  back.position.set(0, 0.72, -0.16);
  back.scale.set(1.5, 1, 0.35);
  chair.add(back);
  root.add(chair);

  // CRT terminal on north desk
  const monitor = new THREE.Group();
  monitor.position.set(0.15, 0.78, -8.45);
  const crt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.38), mats.metal);
  monitor.add(crt);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.3),
    new THREE.MeshBasicMaterial({ color: 0x7dba6a }),
  );
  screen.position.set(0, 0.02, 0.2);
  monitor.add(screen);
  root.add(monitor);

  // Tape prop
  const tape = new THREE.Group();
  tape.position.set(TAPE_POS.x, 0.86, TAPE_POS.z);
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.18), mats.tape);
  tape.add(shell);
  const reel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 10), mats.tapeReel);
  reel1.position.set(-0.06, 0.04, 0);
  tape.add(reel1);
  const reel2 = reel1.clone();
  reel2.position.x = 0.06;
  tape.add(reel2);
  tape.name = "tape";
  root.add(tape);

  // Cardboard box
  const box = new THREE.Group();
  box.position.set(BOX_POS.x, 0, BOX_POS.z);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.72, 0.78), mats.cardboard);
  body.position.y = 0.36;
  body.castShadow = true;
  body.receiveShadow = true;
  box.add(body);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.04, 0.36), mats.cardboard);
  flap.position.set(0, 0.74, -0.12);
  box.add(flap);
  box.name = "box";
  root.add(box);

  // Wall sconce lights (geometry only — lighting is global)
  const addSconce = (x: number, z: number, rotY: number) => {
    const g = new THREE.Group();
    g.position.set(x, 1.15, z);
    g.rotation.y = rotY;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6), mats.metal);
    arm.rotation.z = Math.PI / 2;
    g.add(arm);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xf0ead0 }),
    );
    bulb.position.x = 0.12;
    g.add(bulb);
    root.add(g);
  };
  addSconce(6.35, 2, Math.PI);
  addSconce(6.35, -4, Math.PI);
  addSconce(-5.65, 4, 0);
  addSconce(-12.7, -2, -Math.PI / 2);

  // Surveillance camera
  const cam = new THREE.Group();
  cam.position.set(6.2, 1.55, -8.8);
  cam.rotation.y = -Math.PI * 0.7;
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), mats.metal);
  cam.add(mount);
  const bodyCam = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.16, 4, 8), mats.metal);
  bodyCam.rotation.z = Math.PI / 2;
  bodyCam.position.y = -0.08;
  cam.add(bodyCam);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mats.lens);
  lens.position.set(0.12, -0.08, 0);
  cam.add(lens);
  cam.name = "survCam";
  root.add(cam);

  // Floor number stencil
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.35),
    new THREE.MeshLambertMaterial({ color: COLORS.trim, flatShading: true }),
  );
  decal.rotation.x = -Math.PI / 2;
  decal.position.set(0.4, 0.014, 5.2);
  root.add(decal);

  // A few file stacks on shelves (small boxes OK for props)
  const stack = (x: number, z: number, h: number) => {
    root.add(boxMesh(0.42, h, 0.28, mats.desk, x, SHELF_H + h / 2, z));
  };
  stack(3.4, 1.2, 0.18);
  stack(4.1, 1.6, 0.12);
  stack(-11.4, -4.9, 0.16);

  return { root, tape, box, survCam: cam, monitor };
}
