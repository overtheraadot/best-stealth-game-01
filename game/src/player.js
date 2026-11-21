// The Quiet Stacks — the thief: slow quiet steps, a loud run, picking
// up manuscripts and slipping out of the window once all three are held.
import {
  PLAYER_RADIUS, WALK_SPEED, RUN_SPEED, WALK_NOISE, RUN_NOISE,
  PICKUP_RADIUS, EXIT_RADIUS, MANUSCRIPT_COUNT,
} from './config.js';
import { moveWithCollision, nearestManuscript, inLampLight } from './world.js';

export function buildPlayer() {
  return {
    x: 60, y: 540, radius: PLAYER_RADIUS,
    vx: 0, vy: 0, moving: false, running: false,
    noise: 0, noisePulse: 0, manuscripts: 0, inLight: false,
    facing: 0, stepTimer: 0, clickTarget: null,
  };
}

export function updatePlayer(player, level, input, dt, events) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  // A held key overrides a click target: the player takes over.
  if (dx !== 0 || dy !== 0) player.clickTarget = null;
  // Click-to-move: walk toward the clicked floor tile, keyboard wins.
  if (dx === 0 && dy === 0 && player.clickTarget) {
    const tx = player.clickTarget.x - player.x;
    const ty = player.clickTarget.y - player.y;
    const d = Math.hypot(tx, ty);
    if (d < 8) {
      player.clickTarget = null;
    } else {
      dx = tx / d;
      dy = ty / d;
    }
  }
  const len = Math.hypot(dx, dy);
  player.moving = len > 0;
  player.running = player.moving && input.run;
  const speed = player.running ? RUN_SPEED : WALK_SPEED;
  if (player.moving) {
    const nx = (dx / len) * speed * dt;
    const ny = (dy / len) * speed * dt;
    player.facing = Math.atan2(dy, dx);
    moveWithCollision(level, player, nx, ny);
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.running ? 0.26 : 0.42;
      events.push({ type: 'step', running: player.running });
    }
  }
  // Noise is a ring the guards can hear: running is loud, walking is
  // a whisper. It fades the moment the thief stops.
  const targetNoise = player.running ? RUN_NOISE : (player.moving ? WALK_NOISE : 0);
  player.noise += (targetNoise - player.noise) * Math.min(1, dt * 8);
  if (player.running && player.moving) {
    player.noisePulse += dt;
    if (player.noisePulse > 0.5) {
      player.noisePulse = 0;
      events.push({ type: 'noise', x: player.x, y: player.y, radius: RUN_NOISE });
    }
  }
  player.inLight = inLampLight(level, player.x, player.y);

  const manuscript = nearestManuscript(level, player.x, player.y, PICKUP_RADIUS);
  if (manuscript) {
    manuscript.taken = true;
    player.manuscripts += 1;
    events.push({ type: 'pickup', manuscript });
  }
  return player.manuscripts >= MANUSCRIPT_COUNT;
}

export function playerAtExit(player, level) {
  const dx = player.x - level.exit.x;
  const dy = player.y - level.exit.y;
  return Math.hypot(dx, dy) < EXIT_RADIUS;
}

export function exitIsOpen(player) {
  return player.manuscripts >= MANUSCRIPT_COUNT;
}
