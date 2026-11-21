// The Quiet Stacks — the game loop and the state machine: title,
// playing, paused, caught and won. It owns the canvas sizing, the
// clock, the event fan-out to sound, and the debug handle the
// playtest and the screenshot scenes read.
import { WORLD_W, WORLD_H, GAME_SECONDS } from './config.js';
import { buildLibrary } from './world.js';
import { buildGuards, updateGuard, guardsHearNoise } from './guards.js';
import { buildPlayer, updatePlayer, playerAtExit, exitIsOpen } from './player.js';
import { drawGame } from './render.js';
import { buildAudio, unlockAudio, playStep, playPickup, playSpotted, playAlarm, playCaught, playWin, playHeard } from './audio.js';
import { buildInput, consumePress } from './input.js';
import { applyShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function freshGame() {
  return {
    screen: 'title',
    level: buildLibrary(),
    guards: buildGuards(),
    player: buildPlayer(),
    audio: buildAudio(),
    timeLeft: GAME_SECONDS,
    elapsed: 0,
    endReason: '',
    shot: null,
  };
}

const game = freshGame();
game.input = buildInput(canvas);

function resizeCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function fitWorld() {
  const scale = Math.min(canvas.width / WORLD_W, canvas.height / WORLD_H);
  const ox = (canvas.width - WORLD_W * scale) / 2;
  const oy = (canvas.height - WORLD_H * scale) / 2;
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
}

function handleEvents(events) {
  for (const e of events) {
    if (e.type === 'step') playStep(game.audio, e.running);
    if (e.type === 'pickup') {
      playPickup(game.audio);
      statusEl.textContent = `${e.manuscript.name} stolen — ${game.player.manuscripts} of 3.`;
    }
    if (e.type === 'spotted') playSpotted(game.audio);
    if (e.type === 'alarm') {
      playAlarm(game.audio);
      statusEl.textContent = `${e.guard.name} raised the alarm! Break line of sight!`;
    }
    if (e.type === 'heard') playHeard(game.audio);
    if (e.type === 'noise') guardsHearNoise(game.guards, e.x, e.y, e.radius, events);
    if (e.type === 'caught') {
      game.screen = 'caught';
      game.endReason = `${e.guard.name} caught you in the lantern light.`;
      playCaught(game.audio);
      statusEl.textContent = game.endReason;
    }
  }
}

function startHeist() {
  unlockAudio(game.audio);
  game.screen = 'play';
  statusEl.textContent = 'Steal the three manuscripts and escape through the window.';
}

function restart() {
  const fresh = freshGame();
  game.level = fresh.level;
  game.guards = fresh.guards;
  game.player = fresh.player;
  game.timeLeft = GAME_SECONDS;
  game.elapsed = 0;
  game.endReason = '';
  game.screen = 'play';
  unlockAudio(game.audio);
}

function update(dt) {
  const input = game.input;
  if (consumePress(input, 'KeyR')) {
    if (game.screen !== 'title') restart();
    return;
  }
  if (game.screen === 'title') {
    if (consumePress(input, 'Enter') || consumePress(input, 'Pointer') || consumePress(input, 'Space')) startHeist();
    return;
  }
  if (game.screen === 'win' || game.screen === 'caught') return;
  if (consumePress(input, 'KeyP')) {
    game.screen = game.screen === 'paused' ? 'play' : 'paused';
    return;
  }
  if (game.screen === 'paused') return;

  game.timeLeft -= dt;
  game.elapsed += dt;
  if (game.timeLeft <= 0) {
    game.screen = 'caught';
    game.endReason = 'Dawn broke — the library locked with you inside.';
    playCaught(game.audio);
    return;
  }
  // Click-to-move: translate the click from screen pixels to world.
  if (input.clickX !== null) {
    const scale = Math.min(canvas.width / WORLD_W, canvas.height / WORLD_H);
    const ox = (canvas.width - WORLD_W * scale) / 2;
    const oy = (canvas.height - WORLD_H * scale) / 2;
    game.player.clickTarget = {
      x: (input.clickX * (window.devicePixelRatio || 1) - ox) / scale,
      y: (input.clickY * (window.devicePixelRatio || 1) - oy) / scale,
    };
    input.clickX = null;
    input.clickY = null;
  }
  const events = [];
  const allCollected = updatePlayer(game.player, game.level, input, dt, events);
  for (const guard of game.guards) updateGuard(guard, game.level, game.player, dt, events);
  handleEvents(events);
  if (game.screen !== 'play') return;
  if (allCollected && exitIsOpen(game.player) && playerAtExit(game.player, game.level)) {
    game.screen = 'win';
    playWin(game.audio);
    statusEl.textContent = 'Clean getaway — all three manuscripts stolen.';
  }
}

// Deterministic screenshot scenes (?shot=title|play|alarm|win).
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  game.shot = shotName;
  applyShotScene(game, shotName);
  window.__shotReady = true;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.shot) update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  fitWorld();
  drawGame(ctx, game, now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Handle for scripted playtests and screenshots.
window.__quietStacks = {
  get screen() { return game.screen; },
  get manuscripts() { return game.player.manuscripts; },
  get alert() { return Math.max(0, ...game.guards.map((g) => g.suspicion)); },
  get timeLeft() { return game.timeLeft; },
  get player() { return { x: game.player.x, y: game.player.y }; },
  get guards() { return game.guards.map((g) => ({ name: g.name, state: g.state, suspicion: g.suspicion, x: g.x, y: g.y, angle: g.angle })); },
  start: startHeist,
  restart,
  // Test-only positioning: moves the thief to a floor point so a
  // scripted playtest can stand in a guard's cone or on a manuscript.
  teleport(x, y) { game.player.x = x; game.player.y = y; game.player.clickTarget = null; },
};
