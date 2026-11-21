// The Quiet Stacks — deterministic screenshot scenes. Each ?shot=
// scene poses the game in a fixed, readable moment so the cover and
// the other screenshots show the real game, not a random frame:
// title, mid-play behind cover, a near-detection alarm, and the win.
export function applyShotScene(game, shot) {
  const { player, guards, level } = game;
  if (shot === 'title') {
    game.screen = 'title';
    // Pose the thief mid-room so the title overlay sits over a live level.
    player.x = 480;
    player.y = 380;
    guards[0].x = 380; guards[0].y = 235; guards[0].angle = Math.PI / 2;
    guards[1].x = 165; guards[1].y = 260; guards[1].angle = -Math.PI / 2;
    guards[2].x = 740; guards[2].y = 380; guards[2].angle = Math.PI;
    guards[3].x = 480; guards[3].y = 340; guards[3].angle = 0;
    return;
  }
  if (shot === 'play') {
    game.screen = 'play';
    // The thief crouches behind the west shelf row, just outside
    // Tomas's lantern cone; the cone sweeps past the shelf edge.
    player.x = 168;
    player.y = 252;
    player.facing = Math.PI / 2;
    player.manuscripts = 1;
    level.manuscripts[0].taken = true;
    const tomas = guards[1];
    tomas.x = 250; tomas.y = 252; tomas.angle = Math.PI; tomas.suspicion = 0.22;
    const mara = guards[0];
    mara.x = 380; mara.y = 235; mara.angle = Math.PI; mara.suspicion = 0;
    return;
  }
  if (shot === 'alarm') {
    game.screen = 'play';
    // Near-detection: the thief is caught in Mara's cone at the edge
    // of a light pool, suspicion high, Mara chasing, alarm up.
    player.x = 430;
    player.y = 300;
    player.running = true;
    player.noise = 110;
    player.manuscripts = 2;
    level.manuscripts[0].taken = true;
    level.manuscripts[1].taken = true;
    const mara = guards[0];
    mara.x = 380; mara.y = 235; mara.angle = Math.PI / 4;
    mara.state = 'chase'; mara.suspicion = 0.96; mara.chaseTimer = 3.2;
    const wren = guards[3];
    wren.x = 520; wren.y = 340; wren.angle = Math.PI; wren.suspicion = 0.5;
    return;
  }
  if (shot === 'win') {
    game.screen = 'win';
    player.manuscripts = 3;
    for (const m of level.manuscripts) m.taken = true;
    player.x = 900;
    player.y = 70;
    game.timeLeft = 187;
    return;
  }
  // Unknown scene: fall back to the title so nothing renders blank.
  game.screen = 'title';
}
