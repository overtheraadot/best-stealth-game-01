// The Quiet Stacks — the librarian-guards: patrols, lantern vision
// cones, suspicion, investigation and the short chase that gives the
// player a chance to break away and recover.
import {
  CONE_RANGE, CONE_HALF_ANGLE, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED,
  GUARD_INVESTIGATE_SPEED, GUARD_RADIUS, CATCH_DISTANCE, CHASE_TIME,
  LOSE_SIGHT_TIME, SUSPICION_PER_SECOND, SUSPICION_DECAY, INVESTIGATE_AT,
  SHADOW_SIGHT, LIGHT_SIGHT,
} from './config.js';
import { moveWithCollision, lineOfSightClear, inLampLight } from './world.js';

export function buildGuards() {
  // Patrol loops use only verified-clear corridors: the north
  // rectangle around the archive shelves, the west lane, the east
  // lane and the south reading-room loop. No waypoint line crosses
  // a shelf or a table, so a guard never wedges against one.
  return [
    {
      name: 'Mara', color: '#e8b34b', x: 275, y: 235, angle: 0,
      waypoints: [[275, 235], [620, 235], [620, 60], [275, 60]],
      wp: 0, state: 'patrol', suspicion: 0, chaseTimer: 0,
      blindTimer: 0, lastSeen: null, investigate: null, radius: GUARD_RADIUS,
    },
    {
      name: 'Tomas', color: '#7fb2e8', x: 275, y: 260, angle: Math.PI / 2,
      waypoints: [[275, 260], [275, 520], [165, 520], [165, 440], [275, 440]],
      wp: 0, state: 'patrol', suspicion: 0, chaseTimer: 0,
      blindTimer: 0, lastSeen: null, investigate: null, radius: GUARD_RADIUS,
    },
    {
      name: 'Ilya', color: '#c98ae8', x: 890, y: 60, angle: Math.PI / 2,
      waypoints: [[890, 60], [890, 560], [680, 560]],
      wp: 0, state: 'patrol', suspicion: 0, chaseTimer: 0,
      blindTimer: 0, lastSeen: null, investigate: null, radius: GUARD_RADIUS,
    },
    {
      name: 'Wren', color: '#7ee8a2', x: 300, y: 560, angle: 0,
      waypoints: [[300, 560], [600, 560], [600, 345], [300, 345]],
      wp: 0, state: 'patrol', suspicion: 0, chaseTimer: 0,
      blindTimer: 0, lastSeen: null, investigate: null, radius: GUARD_RADIUS,
    },
  ];
}

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function guardSeesPlayer(guard, level, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return { seen: false, dist };
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toPlayer, guard.angle)) > CONE_HALF_ANGLE) return { seen: false, dist };
  if (!lineOfSightClear(level, guard.x, guard.y, player.x, player.y)) return { seen: false, dist };
  return { seen: true, dist };
}

function stepToward(level, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const vx = (dx / d) * speed * dt;
  const vy = (dy / d) * speed * dt;
  guard.angle = angleTo(guard.x, guard.y, tx, ty);
  moveWithCollision(level, guard, vx, vy);
  return d < speed * dt + 2;
}

export function updateGuard(guard, level, player, dt, events) {
  const sight = guardSeesPlayer(guard, level, player);
  const lit = inLampLight(level, player.x, player.y);
  if (sight.seen) {
    const rate = SUSPICION_PER_SECOND * (lit ? LIGHT_SIGHT : SHADOW_SIGHT);
    const before = guard.suspicion;
    guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.blindTimer = 0;
    if (before < 0.35 && guard.suspicion >= 0.35) events.push({ type: 'spotted', guard });
    if (before < INVESTIGATE_AT && guard.suspicion >= INVESTIGATE_AT && guard.state !== 'chase') {
      guard.state = 'chase';
      guard.chaseTimer = CHASE_TIME;
      events.push({ type: 'alarm', guard });
    }
  } else {
    guard.blindTimer += dt;
    if (guard.state !== 'chase') {
      guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt);
    }
  }

  if (guard.state === 'chase') {
    guard.chaseTimer -= dt;
    const caught = stepToward(level, guard, player.x, player.y, GUARD_CHASE_SPEED, dt);
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    if (dist < CATCH_DISTANCE || caught) {
      events.push({ type: 'caught', guard });
      return;
    }
    if (guard.chaseTimer <= 0 || (guard.blindTimer > LOSE_SIGHT_TIME && guard.suspicion < 1)) {
      // The chase ends, but the guard is not fooled: they walk to the
      // last place they saw the thief and look around.
      guard.state = 'investigate';
      guard.investigate = guard.lastSeen ? { ...guard.lastSeen } : { x: player.x, y: player.y };
      guard.suspicion = Math.max(guard.suspicion, 0.55);
    }
    return;
  }

  if (guard.state === 'investigate' && guard.investigate) {
    const arrived = stepToward(level, guard, guard.investigate.x, guard.investigate.y, GUARD_INVESTIGATE_SPEED, dt);
    if (arrived) {
      guard.state = 'look';
      guard.lookTimer = 1.6;
    }
    return;
  }

  if (guard.state === 'look') {
    guard.lookTimer -= dt;
    guard.angle += dt * 1.8; // scans the room, lantern sweeping
    guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt * 0.5);
    if (guard.lookTimer <= 0) {
      guard.state = 'patrol';
      guard.suspicion = Math.max(0, guard.suspicion - 0.3);
    }
    return;
  }

  // Patrol: walk the waypoint loop, pausing a beat at each corner.
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    return;
  }
  const target = guard.waypoints[guard.wp];
  const arrived = stepToward(level, guard, target[0], target[1], GUARD_PATROL_SPEED, dt);
  if (arrived) {
    guard.wp = (guard.wp + 1) % guard.waypoints.length;
    guard.pauseTimer = 0.7;
  }
}

// A loud noise pulls every guard in earshot toward the sound.
export function guardsHearNoise(guards, x, y, radius, events) {
  for (const guard of guards) {
    if (guard.state === 'chase') continue;
    const d = Math.hypot(guard.x - x, guard.y - y);
    if (d < radius) {
      if (guard.state === 'patrol') events.push({ type: 'heard', guard });
      guard.state = 'investigate';
      guard.investigate = { x, y };
      guard.suspicion = Math.max(guard.suspicion, 0.4);
    }
  }
}
