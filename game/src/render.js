// The Quiet Stacks — everything the player sees: the wood floor, the
// tall shelves, lantern light pools, vision cones, the thief, the
// guards, the manuscripts, the window, and every screen of the game.
import { WORLD_W, WORLD_H, CONE_RANGE, CONE_HALF_ANGLE, LAMP_RADIUS } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, guard) {
  const a0 = guard.angle - CONE_HALF_ANGLE;
  const a1 = guard.angle + CONE_HALF_ANGLE;
  const hot = guard.state === 'chase';
  const warm = guard.suspicion > 0.35;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, CONE_RANGE, a0, a1);
  ctx.closePath();
  ctx.fillStyle = hot
    ? 'rgba(232, 72, 72, 0.30)'
    : warm ? 'rgba(232, 179, 75, 0.26)' : 'rgba(255, 214, 130, 0.20)';
  ctx.fill();
  ctx.strokeStyle = hot ? 'rgba(232, 72, 72, 0.55)' : 'rgba(255, 214, 130, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawShelf(ctx, s, time) {
  ctx.fillStyle = '#4a3220';
  roundRect(ctx, s.x, s.y, s.w, s.h, 4);
  ctx.fill();
  ctx.fillStyle = '#5d4028';
  roundRect(ctx, s.x + 3, s.y + 3, s.w - 6, s.h - 6, 3);
  ctx.fill();
  // Book spines: a row of small coloured blocks along the shelf.
  const horizontal = s.w > s.h;
  const count = Math.floor((horizontal ? s.w : s.h) / 9);
  const palette = ['#8a4b3a', '#3a5a8a', '#4a7a4a', '#8a7a3a', '#6a3a6a', '#a06a2a'];
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = palette[(i * 2 + (horizontal ? 0 : 1)) % palette.length];
    if (horizontal) ctx.fillRect(s.x + 5 + i * 9, s.y + 5, 6, s.h - 10);
    else ctx.fillRect(s.x + 5, s.y + 5 + i * 9, s.w - 10, 6);
  }
  void time;
}

function drawGuard(ctx, guard, time) {
  drawCone(ctx, guard);
  // Lantern glow around the guard.
  const glow = ctx.createRadialGradient(guard.x, guard.y, 4, guard.x, guard.y, 46);
  glow.addColorStop(0, 'rgba(255, 210, 120, 0.35)');
  glow.addColorStop(1, 'rgba(255, 210, 120, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 46, 0, Math.PI * 2);
  ctx.fill();
  // Librarian: dark robe, pale collar, lantern in hand.
  ctx.fillStyle = '#232733';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240, 235, 220, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = guard.color;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd678';
  const lx = guard.x + Math.cos(guard.angle) * 15;
  const ly = guard.y + Math.sin(guard.angle) * 15;
  ctx.beginPath();
  ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion mark above the head: ? when wary, ! when chasing.
  if (guard.suspicion > 0.35 || guard.state === 'chase') {
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = guard.state === 'chase' ? '#ff5a5a' : '#ffcf5a';
    ctx.fillText(guard.state === 'chase' ? '!' : '?', guard.x, guard.y - 20);
  }
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(230, 225, 210, 0.85)';
  ctx.fillText(guard.name, guard.x, guard.y + 26);
  void time;
}

function drawPlayer(ctx, player, time) {
  // Noise ring while running — the sound the guards can hear.
  if (player.noise > 40) {
    ctx.strokeStyle = `rgba(200, 220, 255, ${Math.min(0.5, player.noise / 260)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.noise, 0, Math.PI * 2);
    ctx.stroke();
  }
  const bob = player.moving ? Math.sin(time * 10) * 1.5 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // The thief: hooded cloak, dark teal against the warm floor.
  ctx.fillStyle = '#1e6f6a';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8f0e8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#123f3c';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.facing) * 4, player.y + Math.sin(player.facing) * 4 + bob, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawManuscript(ctx, m, time) {
  const pulse = 0.6 + Math.sin(time * 3 + m.id * 2) * 0.25;
  const glow = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, 30);
  glow.addColorStop(0, `rgba(255, 230, 150, ${0.5 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 230, 150, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(m.x, m.y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5e6b8';
  ctx.fillRect(m.x - 8, m.y - 6, 16, 12);
  ctx.strokeStyle = '#8a6a2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(m.x - 8, m.y - 6, 16, 12);
  ctx.beginPath();
  ctx.moveTo(m.x - 5, m.y - 2);
  ctx.lineTo(m.x + 5, m.y - 2);
  ctx.moveTo(m.x - 5, m.y + 2);
  ctx.lineTo(m.x + 5, m.y + 2);
  ctx.stroke();
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(m.name, m.x, m.y - 14);
}

function drawExit(ctx, exit, open, time) {
  ctx.fillStyle = open ? '#9fd8ff' : '#5a6a7a';
  roundRect(ctx, exit.x - 22, exit.y - 16, 44, 32, 4);
  ctx.fill();
  ctx.strokeStyle = open ? '#dff2ff' : '#8a9aaa';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(exit.x, exit.y - 16);
  ctx.lineTo(exit.x, exit.y + 16);
  ctx.stroke();
  if (open) {
    const a = 0.5 + Math.sin(time * 4) * 0.3;
    ctx.fillStyle = `rgba(220, 245, 255, ${a})`;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('ESCAPE — WINDOW OPEN', exit.x + 20, exit.y + 34);
  } else {
    ctx.fillStyle = 'rgba(220, 225, 235, 0.8)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('WINDOW — LOCKED', exit.x + 20, exit.y + 34);
  }
}

function drawHud(ctx, game, time) {
  const { player, guards } = game;
  const alert = Math.max(0, ...guards.map((g) => g.suspicion));
  ctx.fillStyle = 'rgba(8, 10, 16, 0.82)';
  roundRect(ctx, 12, 12, 380, 64, 8);
  ctx.fill();
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE QUIET STACKS', 24, 34);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#ffd678';
  ctx.fillText(`Manuscripts  ${player.manuscripts} / 3`, 24, 56);
  ctx.fillStyle = player.inLight ? '#ffb84d' : '#7ee8a2';
  ctx.fillText(player.inLight ? 'IN THE LIGHT — seen fast' : 'IN SHADOW — hard to see', 168, 56);
  // Noise bar.
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, 408, 12, 160, 28, 6);
  ctx.fill();
  ctx.fillStyle = player.noise > 80 ? '#ff8a5a' : '#8ab8ff';
  roundRect(ctx, 410, 14, Math.min(156, (player.noise / 118) * 156), 24, 5);
  ctx.fill();
  ctx.fillStyle = '#e8e2d2';
  ctx.font = '12px sans-serif';
  ctx.fillText(player.running ? 'NOISE — RUNNING!' : 'noise', 416, 30);
  // Alert bar.
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, 584, 12, 160, 28, 6);
  ctx.fill();
  ctx.fillStyle = alert > 0.7 ? '#ff5a5a' : alert > 0.35 ? '#ffcf5a' : '#7ee8a2';
  roundRect(ctx, 586, 14, Math.max(4, alert * 156), 24, 5);
  ctx.fill();
  ctx.fillStyle = '#e8e2d2';
  ctx.fillText(alert > 0.7 ? 'ALARM — RUN!' : alert > 0.35 ? 'alert — suspicious' : 'alert — calm', 592, 30);
  // Night timer.
  const left = Math.max(0, Math.ceil(game.timeLeft));
  ctx.fillStyle = 'rgba(8, 10, 16, 0.82)';
  roundRect(ctx, 760, 12, 122, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#f2ead8';
  ctx.fillText(`Night ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 772, 30);
  // Controls hint, bottom left.
  ctx.fillStyle = 'rgba(8, 10, 16, 0.7)';
  roundRect(ctx, 12, WORLD_H - 34, 430, 24, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(232, 226, 210, 0.9)';
  ctx.font = '12px sans-serif';
  ctx.fillText('WASD / arrows move · SHIFT run (loud) · click to walk · P pause · R restart', 20, WORLD_H - 18);
  void time;
}

function drawTitle(ctx, game, time) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.72)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd678';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText('THE QUIET STACKS', WORLD_W / 2, 190);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('A night heist in the old university library', WORLD_W / 2, 228);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#cfc8b4';
  ctx.fillText('Steal the 3 rare manuscripts. Dodge the librarians’ lantern cones.', WORLD_W / 2, 272);
  ctx.fillText('Hide behind tall shelves. Stay out of the light. Run only when you must.', WORLD_W / 2, 296);
  ctx.fillText('Escape through the reading-room window — unseen.', WORLD_W / 2, 320);
  const pulse = 0.65 + Math.sin(time * 3) * 0.35;
  ctx.fillStyle = `rgba(255, 214, 120, ${pulse})`;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press ENTER or click to begin the heist', WORLD_W / 2, 380);
  ctx.fillStyle = 'rgba(207, 200, 180, 0.85)';
  ctx.font = '14px sans-serif';
  ctx.fillText('WASD / arrows to move · SHIFT to run (loud!) · P to pause', WORLD_W / 2, 420);
  ctx.fillText('Manuscripts: The Star Atlas · The Tide Codex · The Ember Folio', WORLD_W / 2, 446);
  void game;
}

function drawEnd(ctx, game, won) {
  ctx.fillStyle = won ? 'rgba(6, 20, 12, 0.78)' : 'rgba(24, 6, 8, 0.78)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#7ee8a2' : '#ff8a7a';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText(won ? 'CLEAN GETAWAY' : 'CAUGHT IN THE STACKS', WORLD_W / 2, 220);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '18px sans-serif';
  if (won) {
    ctx.fillText(`All three manuscripts are yours. The librarians never saw a thing.`, WORLD_W / 2, 268);
    ctx.fillText(`Finished with ${Math.max(0, Math.ceil(game.timeLeft))} seconds of night to spare.`, WORLD_W / 2, 296);
  } else {
    ctx.fillText(game.endReason || 'A librarian caught you in the lantern light.', WORLD_W / 2, 268);
    ctx.fillText(`Manuscripts stolen: ${game.player.manuscripts} of 3.`, WORLD_W / 2, 296);
  }
  const pulse = 0.65 + Math.sin(performance.now() / 300) * 0.35;
  ctx.fillStyle = `rgba(255, 214, 120, ${pulse})`;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Press R to steal again', WORLD_W / 2, 360);
}

export function drawGame(ctx, game, time) {
  const { level, player, guards } = game;
  // Floor: warm wood planks with a darker border aisle.
  ctx.fillStyle = '#6a4a2c';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = '#7a5636';
  for (let y = 24; y < WORLD_H - 24; y += 28) {
    ctx.fillRect(24, y, WORLD_W - 48, 1);
  }
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 0, WORLD_W, 24);
  ctx.fillRect(0, WORLD_H - 24, WORLD_W, 24);
  ctx.fillRect(0, 0, 24, WORLD_H);
  ctx.fillRect(WORLD_W - 24, 0, 24, WORLD_H);
  // Rug in the reading room.
  ctx.fillStyle = '#5a2e35';
  roundRect(ctx, 300, 230, 300, 180, 10);
  ctx.fill();
  ctx.strokeStyle = '#8a4a3a';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Lamp light pools on the floor.
  for (const lamp of level.lamps) {
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, lamp.r);
    glow.addColorStop(0, 'rgba(255, 214, 130, 0.30)');
    glow.addColorStop(1, 'rgba(255, 214, 130, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2118';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd678';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const t of level.tables) {
    ctx.fillStyle = '#3d2c1c';
    roundRect(ctx, t.x, t.y, t.w, t.h, 4);
    ctx.fill();
    ctx.fillStyle = '#5a4028';
    roundRect(ctx, t.x + 4, t.y + 4, t.w - 8, t.h - 8, 3);
    ctx.fill();
  }
  for (const s of level.shelves) drawShelf(ctx, s, time);
  // Night darkness falls over the floor and shelves first; the
  // guards, their cones, the thief and the manuscripts are drawn
  // after it, so the stealth elements stay readable in the dark.
  ctx.save();
  ctx.fillStyle = 'rgba(4, 6, 14, 0.42)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.globalCompositeOperation = 'destination-out';
  for (const lamp of level.lamps) {
    const hole = ctx.createRadialGradient(lamp.x, lamp.y, 10, lamp.x, lamp.y, lamp.r);
    hole.addColorStop(0, 'rgba(0,0,0,0.85)');
    hole.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  const ph = ctx.createRadialGradient(player.x, player.y, 8, player.x, player.y, 90);
  ph.addColorStop(0, 'rgba(0,0,0,0.7)');
  ph.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ph;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  for (const m of level.manuscripts) if (!m.taken) drawManuscript(ctx, m, time);
  drawExit(ctx, level.exit, game.player.manuscripts >= 3, time);
  for (const guard of guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, player, time);
  if (game.screen === 'play' || game.screen === 'paused') drawHud(ctx, game, time);
  if (game.screen === 'title') drawTitle(ctx, game, time);
  if (game.screen === 'win') drawEnd(ctx, game, true);
  if (game.screen === 'caught') drawEnd(ctx, game, false);
  if (game.screen === 'paused') {
    ctx.fillStyle = 'rgba(6, 8, 14, 0.6)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.fillStyle = '#f2ead8';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — the library holds its breath', WORLD_W / 2, WORLD_H / 2);
  }
}
