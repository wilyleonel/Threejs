import * as THREE from "three";

const WORKING_ROTATION = Math.PI; // facing his monitor, back to the player
const ALERT_ROTATION = 0; // facing the player

const STATE = {
  WORKING: "WORKING",
  TURNING: "TURNING",
  ALERT: "ALERT",
  RETURNING: "RETURNING",
};

export class Boss {
  constructor(mesh) {
    this.mesh = mesh;
    this.state = STATE.WORKING;
    this.turnSpeed = 6; // rad/s
    this.timeUntilNextTurn = this.randomRange(2.5, 4.5);
    this.alertTimer = 0;
    this.alertDuration = this.randomRange(1.1, 1.8);

    this.minDelay = 2.5;
    this.maxDelay = 4.5;
  }

  get isFacingPlayer() {
    return this.state === STATE.ALERT;
  }

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  setDifficulty(score) {
    const tier = Math.floor(score / 30);
    this.minDelay = Math.max(1.0, 2.5 - tier * 0.25);
    this.maxDelay = Math.max(1.8, 4.5 - tier * 0.3);
    this.turnSpeed = Math.min(12, 6 + tier * 0.5);
  }

  forceWorking() {
    this.state = STATE.WORKING;
    this.mesh.rotation.y = WORKING_ROTATION;
    this.timeUntilNextTurn = this.randomRange(this.minDelay, this.maxDelay);
  }

  update(dt) {
    switch (this.state) {
      case STATE.WORKING:
        this.timeUntilNextTurn -= dt;
        if (this.timeUntilNextTurn <= 0) {
          this.state = STATE.TURNING;
        }
        break;

      case STATE.TURNING: {
        const diff = ALERT_ROTATION - this.mesh.rotation.y;
        const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
        const step = Math.sign(wrapped) * this.turnSpeed * dt;
        if (Math.abs(step) >= Math.abs(wrapped)) {
          this.mesh.rotation.y = ALERT_ROTATION;
          this.state = STATE.ALERT;
          this.alertTimer = this.randomRange(this.minDelay * 0.45, this.alertDuration);
        } else {
          this.mesh.rotation.y += step;
        }
        break;
      }

      case STATE.ALERT:
        this.alertTimer -= dt;
        if (this.alertTimer <= 0) {
          this.state = STATE.RETURNING;
        }
        break;

      case STATE.RETURNING: {
        const diff = WORKING_ROTATION - this.mesh.rotation.y;
        const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
        const step = Math.sign(wrapped) * this.turnSpeed * dt;
        if (Math.abs(step) >= Math.abs(wrapped)) {
          this.mesh.rotation.y = WORKING_ROTATION;
          this.state = STATE.WORKING;
          this.timeUntilNextTurn = this.randomRange(this.minDelay, this.maxDelay);
        } else {
          this.mesh.rotation.y += step;
        }
        break;
      }
    }
  }
}
