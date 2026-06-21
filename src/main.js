import * as THREE from "three";
import "./style.css";
import { createOffice } from "./office.js";
import { Boss } from "./Boss.js";

const canvas = document.getElementById("scene");
const scoreEl = document.getElementById("score");
const scoreboardEl = document.getElementById("scoreboard");
const livesEl = document.getElementById("lives");
const toastEl = document.getElementById("toast");
const hintEl = document.getElementById("hint");
const gameoverEl = document.getElementById("gameover");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");

const nameScreenEl = document.getElementById("nameScreen");
const bossNameInput = document.getElementById("bossNameInput");
const devNameInputsEl = document.getElementById("devNameInputs");
const startBtn = document.getElementById("startBtn");

const GRAVITY = 14;
const THROW_DURATION = 0.55;
const MAX_LIVES = 3;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111319);
scene.fog = new THREE.Fog(0x111319, 12, 24);

const camera = new THREE.PerspectiveCamera(
  62,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.55, 9);
camera.lookAt(0, 1.1, -8);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const { devUnits, boss: bossInfo, bossZ } = createOffice(scene);
const boss = new Boss(bossInfo.group);

const hitboxMeshes = [bossInfo.hitbox, ...devUnits.map((d) => d.hitbox)];

// Invisible plane at the boss's depth, used as a fallback aim point for throws that hit no one.
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -bossZ);
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const fallbackAimPoint = new THREE.Vector3();

const balls = [];
const ballGeometry = new THREE.IcosahedronGeometry(0.07, 0);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.9 });

let lives = MAX_LIVES;
let gameOver = false;
let gameStarted = false;

// --- Name screen setup ---

devUnits.forEach((dev, i) => {
  const field = document.createElement("label");
  field.className = "field";
  field.innerHTML = `<span>${dev.name}</span><input type="text" maxlength="16" placeholder="${dev.name}" data-dev-index="${i}" />`;
  devNameInputsEl.appendChild(field);
});

function startGame() {
  const bossName = bossNameInput.value.trim() || "Jefe";
  bossInfo.setName(bossName);

  devUnits.forEach((dev, i) => {
    const input = devNameInputsEl.querySelector(`input[data-dev-index="${i}"]`);
    const name = (input?.value || "").trim() || dev.name;
    dev.setName(name);
  });

  hintEl.textContent = `Click para tirar el papel. ¡No lo hagas cuando ${bossName} te mire!`;
  nameScreenEl.classList.add("hidden");
  gameStarted = true;
  boss.forceWorking();
}

startBtn.addEventListener("click", startGame);

// --- HUD helpers ---

function getTotalScore() {
  return bossInfo.score + devUnits.reduce((sum, dev) => sum + dev.score, 0);
}

function updateHud() {
  const total = getTotalScore();
  scoreEl.textContent = `Puntos: ${total}`;
  livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(MAX_LIVES - lives);

  scoreboardEl.innerHTML = "";
  const bossRow = document.createElement("div");
  bossRow.className = "row boss";
  bossRow.textContent = `${bossInfo.name}: ${bossInfo.score}`;
  scoreboardEl.appendChild(bossRow);

  devUnits.forEach((dev) => {
    const row = document.createElement("div");
    row.className = "row";
    row.textContent = `${dev.name}: ${dev.score}`;
    scoreboardEl.appendChild(row);
  });
}

function showToast(text, color) {
  toastEl.textContent = text;
  toastEl.style.color = color;
  toastEl.classList.remove("show");
  // restart the animation
  void toastEl.offsetWidth;
  toastEl.classList.add("show");
}

function getFallbackAimPoint(clientX, clientY) {
  ndc.x = (clientX / window.innerWidth) * 2 - 1;
  ndc.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  raycaster.ray.intersectPlane(aimPlane, fallbackAimPoint);
  return fallbackAimPoint;
}

function spawnBall(target) {
  const start = camera.position.clone();
  start.y -= 0.25;
  start.add(new THREE.Vector3(0, 0, -0.4).applyQuaternion(camera.quaternion));

  const mesh = new THREE.Mesh(ballGeometry, ballMaterial);
  mesh.position.copy(start);
  scene.add(mesh);

  const T = THROW_DURATION;
  const velocity = new THREE.Vector3(
    (target.x - start.x) / T,
    (target.y - start.y + 0.5 * GRAVITY * T * T) / T,
    (target.z - start.z) / T
  );

  balls.push({ mesh, start, velocity, elapsed: 0, duration: T });
}

function updateBalls(dt) {
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    ball.elapsed += dt;
    const t = ball.elapsed;
    ball.mesh.position.set(
      ball.start.x + ball.velocity.x * t,
      ball.start.y + ball.velocity.y * t - 0.5 * GRAVITY * t * t,
      ball.start.z + ball.velocity.z * t
    );
    ball.mesh.rotation.x += dt * 8;
    ball.mesh.rotation.y += dt * 5;

    if (ball.elapsed >= ball.duration + 0.4 || ball.mesh.position.y < -1) {
      scene.remove(ball.mesh);
      balls.splice(i, 1);
    }
  }
}

function loseLife() {
  lives -= 1;
  updateHud();
  showToast(`¡${bossInfo.name} TE VIO!`, "#ff4d5e");
  flashScreen();
  if (lives <= 0) {
    triggerGameOver();
  }
}

function flashScreen() {
  canvas.style.filter = "brightness(1.6) saturate(0.3) sepia(0.3) hue-rotate(-20deg)";
  setTimeout(() => {
    canvas.style.filter = "";
  }, 180);
}

function triggerGameOver() {
  gameOver = true;
  finalScoreEl.textContent = `Puntos: ${getTotalScore()}`;
  gameoverEl.classList.remove("hidden");
}

function restart() {
  bossInfo.score = 0;
  devUnits.forEach((dev) => (dev.score = 0));
  lives = MAX_LIVES;
  gameOver = false;
  boss.forceWorking();
  balls.forEach((b) => scene.remove(b.mesh));
  balls.length = 0;
  updateHud();
  gameoverEl.classList.add("hidden");
}

function onThrow(clientX, clientY) {
  if (!gameStarted || gameOver) return;

  ndc.x = (clientX / window.innerWidth) * 2 - 1;
  ndc.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const intersections = raycaster.intersectObjects(hitboxMeshes);
  const target = intersections.length ? intersections[0].object.userData.ref : null;

  const flightDestination = target ? target.headPosition.clone() : getFallbackAimPoint(clientX, clientY).clone();
  spawnBall(flightDestination);

  if (boss.isFacingPlayer) {
    loseLife();
    return;
  }

  if (target) {
    target.score += target.points;
    boss.setDifficulty(getTotalScore());
    updateHud();
    const color = target.kind === "boss" ? "#7CFC9A" : "#9ad1ff";
    showToast(`+${target.points} ${target.name}`, color);
  } else {
    showToast("Fallaste", "rgba(255,255,255,0.6)");
  }
}

canvas.addEventListener("click", (e) => onThrow(e.clientX, e.clientY));
restartBtn.addEventListener("click", restart);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (gameStarted && !gameOver) {
    boss.update(dt);
  }
  updateBalls(dt);

  renderer.render(scene, camera);
}

updateHud();
animate();
