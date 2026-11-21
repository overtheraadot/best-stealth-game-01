// The Quiet Stacks — the library itself: walls, bookshelves, tables,
// lamps, manuscripts and the escape window. This file owns the level
// geometry, collision and line-of-sight; nothing here moves or draws.
import { WORLD_W, WORLD_H, LAMP_RADIUS } from './config.js';

// A shelf is cover: it blocks movement and a guard's line of sight.
export function buildLibrary() {
  const shelves = [
    // West wing — two long rows the player can slip between.
    { x: 90, y: 110, w: 150, h: 26 },
    { x: 90, y: 190, w: 150, h: 26 },
    { x: 90, y: 300, w: 150, h: 26 },
    { x: 90, y: 380, w: 150, h: 26 },
    // North archive — a staggered wall of tall stacks.
    { x: 330, y: 84, w: 26, h: 130 },
    { x: 410, y: 84, w: 26, h: 130 },
    { x: 490, y: 84, w: 26, h: 130 },
    // Middle reading room — tables are low cover, shelves are tall.
    { x: 330, y: 300, w: 130, h: 26 },
    { x: 540, y: 300, w: 130, h: 26 },
    { x: 330, y: 430, w: 26, h: 110 },
    { x: 540, y: 430, w: 26, h: 110 },
    // East stacks — a maze lane guarding the third manuscript.
    { x: 700, y: 120, w: 26, h: 140 },
    { x: 780, y: 120, w: 26, h: 140 },
    { x: 700, y: 330, w: 150, h: 26 },
    { x: 700, y: 430, w: 150, h: 26 },
  ];
  // Low reading tables: they block movement but NOT sight — you can
  // crouch behind one only in the dark, never in a lantern's light.
  const tables = [
    { x: 300, y: 250, w: 90, h: 34 },
    { x: 480, y: 250, w: 90, h: 34 },
    { x: 390, y: 470, w: 120, h: 34 },
    { x: 640, y: 180, w: 34, h: 90 },
  ];
  const lamps = [
    { x: 170, y: 70, r: LAMP_RADIUS },
    { x: 480, y: 240, r: LAMP_RADIUS },
    { x: 850, y: 90, r: LAMP_RADIUS },
    { x: 170, y: 520, r: LAMP_RADIUS },
    { x: 620, y: 520, r: LAMP_RADIUS },
    { x: 850, y: 480, r: LAMP_RADIUS },
  ];
  const manuscripts = [
    { id: 0, name: 'The Star Atlas', x: 165, y: 155, taken: false },
    { id: 1, name: 'The Tide Codex', x: 448, y: 150, taken: false },
    { id: 2, name: 'The Ember Folio', x: 815, y: 285, taken: false },
  ];
  const exit = { x: 922, y: 58, name: 'Reading-room window' };
  return { shelves, tables, lamps, manuscripts, exit };
}

export function rectsCollideCircle(rect, cx, cy, r) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function hitsSolid(level, x, y, r) {
  if (x < 24 + r || x > WORLD_W - 24 - r || y < 24 + r || y > WORLD_H - 24 - r) return true;
  for (const s of level.shelves) if (rectsCollideCircle(s, x, y, r)) return true;
  for (const t of level.tables) if (rectsCollideCircle(t, x, y, r)) return true;
  return false;
}

// Move a circle one axis at a time so it slides along shelves.
export function moveWithCollision(level, body, dx, dy) {
  const nx = body.x + dx;
  if (!hitsSolid(level, nx, body.y, body.radius)) body.x = nx;
  const ny = body.y + dy;
  if (!hitsSolid(level, body.x, ny, body.radius)) body.y = ny;
}

function segmentHitsRect(x0, y0, x1, y1, rect) {
  // Sample the segment; shelves are axis-aligned and small, so a
  // fine sample is exact enough for a sight check at this scale.
  const steps = 32;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h) return true;
  }
  return false;
}

export function lineOfSightClear(level, x0, y0, x1, y1) {
  for (const s of level.shelves) {
    if (segmentHitsRect(x0, y0, x1, y1, s)) return false;
  }
  return true;
}

export function inLampLight(level, x, y) {
  for (const lamp of level.lamps) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy < lamp.r * lamp.r) return true;
  }
  return false;
}

export function nearestManuscript(level, x, y, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const m of level.manuscripts) {
    if (m.taken) continue;
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < bestD) { bestD = d; best = m; }
  }
  return best;
}
