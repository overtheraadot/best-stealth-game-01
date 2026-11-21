// The Quiet Stacks — keyboard and mouse input. WASD and arrows move,
// Shift runs, P pauses, R restarts, Enter starts. A mouse click sets
// a walk target on the floor. Keys are tracked as a held set so the
// player can hold two directions at once for diagonal movement.
export function buildInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false, run: false,
    pressed: new Set(),
    clickX: null, clickY: null,
  };
  const keyMap = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'run', ShiftRight: 'run',
  };
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    const field = keyMap[e.code];
    if (field) input[field] = true;
    if (!e.repeat) input.pressed.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    const field = keyMap[e.code];
    if (field) input[field] = false;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.run = false;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.clickX = e.clientX - rect.left;
    input.clickY = e.clientY - rect.top;
    input.pressed.add('Pointer');
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  return input;
}

export function consumePress(input, code) {
  if (input.pressed.has(code)) {
    input.pressed.delete(code);
    return true;
  }
  return false;
}
