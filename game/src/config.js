// The Quiet Stacks — tuning constants for the whole game.
// One place for every number a designer would want to tweak: speeds,
// sight, sound, light and the win/lose thresholds.
export const WORLD_W = 960;
export const WORLD_H = 600;

export const PLAYER_RADIUS = 12; // matches the drawn thief in render.js
export const WALK_SPEED = 132;
export const RUN_SPEED = 212;
export const WALK_NOISE = 34;
export const RUN_NOISE = 118;
export const NOISE_FADE = 90;

export const GUARD_RADIUS = 12;
export const GUARD_PATROL_SPEED = 58;
export const GUARD_CHASE_SPEED = 188;
export const GUARD_INVESTIGATE_SPEED = 96;
export const CONE_RANGE = 178;
export const CONE_HALF_ANGLE = 0.66; // radians, about 38 degrees each side
export const CATCH_DISTANCE = 24;
export const CHASE_TIME = 3.6;
export const LOSE_SIGHT_TIME = 1.25;

export const MANUSCRIPT_COUNT = 3;
export const PICKUP_RADIUS = 26;
export const EXIT_RADIUS = 30;

export const LAMP_RADIUS = 92;
export const SHADOW_SIGHT = 0.55; // how fast suspicion grows in shadow
export const LIGHT_SIGHT = 1.0;

export const SUSPICION_PER_SECOND = 1.15;
export const SUSPICION_DECAY = 0.45;
export const INVESTIGATE_AT = 0.7;

export const GAME_SECONDS = 300; // night timer; the library locks at dawn
