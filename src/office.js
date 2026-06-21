import * as THREE from "three";

const SKIN = 0xe0a872;
const SHIRT_COLORS = [0x3a86ff, 0x06d6a0, 0xffb703, 0x8338ec, 0xfb5607];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function setLabelText(sprite, text) {
  const canvas = sprite.userData.canvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(15, 17, 22, 0.72)";
  roundRect(ctx, 8, 8, canvas.width - 16, canvas.height - 16, 14);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  sprite.userData.texture.needsUpdate = true;
}

function createLabelSprite(initialText) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.5, 0.38, 1);
  sprite.userData.canvas = canvas;
  sprite.userData.texture = texture;
  setLabelText(sprite, initialText);
  return sprite;
}

function createHitbox(kind) {
  const hitbox = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitbox.userData.kind = kind;
  return hitbox;
}

function createSeatedFigure({ shirtColor = 0x3a86ff, suit = false } = {}) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: suit ? 0x1f2733 : shirtColor,
    roughness: 0.8,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.7 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 4, 8), bodyMat);
  torso.position.y = 0.95;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinMat);
  head.position.y = 1.42;
  head.castShadow = true;
  group.add(head);

  if (suit) {
    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.4, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xc1121f })
    );
    tie.position.set(0, 0.95, 0.27);
    group.add(tie);
  }

  const armMat = bodyMat;
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.42, 4, 8), armMat);
  armL.position.set(-0.32, 0.85, 0.12);
  armL.rotation.x = -0.9;
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.32;
  group.add(armR);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.9 });
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.45, 4, 8), legMat);
  legL.rotation.x = Math.PI / 2;
  legL.position.set(-0.13, 0.62, 0.32);
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.13;
  group.add(legR);

  group.userData.head = head;
  return group;
}

function createChair() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.6 });

  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), mat);
  seat.position.y = 0.5;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.08), mat);
  back.position.set(0, 0.85, -0.26);
  group.add(back);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), mat);
  pole.position.y = 0.27;
  group.add(pole);

  const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (let i = 0; i < 5; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.04), baseMat);
    leg.position.y = 0.05;
    leg.rotation.y = (i / 5) * Math.PI * 2;
    leg.translateX(0.14);
    group.add(leg);
  }

  return group;
}

function createDesk(width = 1.4) {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e4e, roughness: 0.7 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.5 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, 0.7), woodMat);
  top.position.y = 0.75;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const legPositions = [
    [-width / 2 + 0.08, 0.375, -0.28],
    [width / 2 - 0.08, 0.375, -0.28],
    [-width / 2 + 0.08, 0.375, 0.28],
    [width / 2 - 0.08, 0.375, 0.28],
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), metalMat);
    leg.position.set(x, y, z);
    group.add(leg);
  });

  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.32, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x1c3d5a, emissiveIntensity: 0.6 })
  );
  monitor.position.set(0, 1.0, -0.22);
  group.add(monitor);

  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.05), metalMat);
  stand.position.set(0, 0.84, -0.22);
  group.add(stand);

  return group;
}

function createDeveloperUnit(x, z, rotationY, shirtColor, defaultName) {
  const unit = new THREE.Group();
  unit.position.set(x, 0, z);
  unit.rotation.y = rotationY;

  const desk = createDesk();
  desk.position.z = 0.85;
  unit.add(desk);

  const chair = createChair();
  unit.add(chair);

  const dev = createSeatedFigure({ shirtColor });
  unit.add(dev);

  const hitbox = createHitbox("dev");
  hitbox.position.set(0, 1.1, 0);
  unit.add(hitbox);

  const nameSprite = createLabelSprite(defaultName);
  nameSprite.position.set(0, 1.95, 0);
  unit.add(nameSprite);

  const descriptor = {
    kind: "dev",
    group: unit,
    headPosition: new THREE.Vector3(x, 1.42, z),
    nameSprite,
    hitbox,
    name: defaultName,
    points: 5,
    score: 0,
    setName(text) {
      this.name = text;
      setLabelText(this.nameSprite, text);
    },
  };
  hitbox.userData.ref = descriptor;

  return descriptor;
}

export function createOffice(scene) {
  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 24),
    new THREE.MeshStandardMaterial({ color: 0x4a4e57, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 7),
    new THREE.MeshStandardMaterial({ color: 0x2e3340, roughness: 1 })
  );
  backWall.position.set(0, 3.5, -11);
  scene.add(backWall);

  // Side walls
  const sideWallMat = new THREE.MeshStandardMaterial({ color: 0x262a34, roughness: 1 });
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(24, 7), sideWallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-9, 3.5, 0);
  scene.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(9, 3.5, 0);
  scene.add(rightWall);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(4, 8, 6);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xfff4dd, 0.6, 20);
  fillLight.position.set(-3, 4, -4);
  scene.add(fillLight);

  // Developer desks along the side walls, well separated so each one is an easy, distinct target.
  const devUnits = [];
  const FACE_RIGHT = Math.PI / 2; // faces +X, toward the center aisle
  const FACE_LEFT = -Math.PI / 2; // faces -X, toward the center aisle
  // Each row sits at a different depth AND a different x/depth ratio, so on screen they
  // land in distinct, non-overlapping bands instead of lining up behind one another.
  const layout = [
    [-4.0, 3.0, FACE_RIGHT],
    [4.0, 3.0, FACE_LEFT],
    [-2.5, -0.5, FACE_RIGHT],
    [2.5, -0.5, FACE_LEFT],
    [-6.0, -4.5, FACE_RIGHT],
    [6.0, -4.5, FACE_LEFT],
  ];
  layout.forEach(([x, z, rotationY], i) => {
    const descriptor = createDeveloperUnit(
      x,
      z,
      rotationY,
      SHIRT_COLORS[i % SHIRT_COLORS.length],
      `Compañero ${i + 1}`
    );
    scene.add(descriptor.group);
    devUnits.push(descriptor);
  });

  // Boss desk at the far end
  const bossZ = -8.2;
  const bossDesk = createDesk(1.8);
  bossDesk.position.set(0, 0, bossZ - 0.55);
  scene.add(bossDesk);

  const bossChair = createChair();
  bossChair.position.set(0, 0, bossZ);
  scene.add(bossChair);

  const bossMesh = createSeatedFigure({ suit: true });
  bossMesh.position.set(0, 0, bossZ);
  // Front of the figure model points toward +Z; default ("safe") state faces the monitor at -Z, away from the player.
  bossMesh.rotation.y = Math.PI;
  scene.add(bossMesh);

  const bossHitbox = createHitbox("boss");
  bossHitbox.position.set(0, 1.1, 0);
  bossMesh.add(bossHitbox);

  const bossNameSprite = createLabelSprite("Jefe");
  bossNameSprite.position.set(0, 1.95, 0);
  bossMesh.add(bossNameSprite);

  const boss = {
    kind: "boss",
    group: bossMesh,
    headPosition: new THREE.Vector3(0, 1.42, bossZ),
    nameSprite: bossNameSprite,
    hitbox: bossHitbox,
    name: "Jefe",
    points: 25,
    score: 0,
    setName(text) {
      this.name = text;
      setLabelText(this.nameSprite, text);
    },
  };
  bossHitbox.userData.ref = boss;

  return { devUnits, boss, bossZ };
}
