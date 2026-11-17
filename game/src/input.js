// Keyboard + mouse input. Movement on WASD / arrows, aim with the mouse,
// powers on mouse buttons and number / letter keys (see main.js).

export const keys = new Set();
export const mouse = { x: 640, y: 380, down: false, rdown: false };
export const pressed = new Set(); // keys that went down this frame

export function attachInput(canvas, onClick) {
  const rect = () => canvas.getBoundingClientRect();
  const toGame = (e) => {
    const r = rect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  };
  canvas.addEventListener('mousemove', (e) => { const p = toGame(e); mouse.x = p.x; mouse.y = p.y; });
  canvas.addEventListener('mousedown', (e) => {
    const p = toGame(e); mouse.x = p.x; mouse.y = p.y;
    if (e.button === 0) { mouse.down = true; onClick && onClick(p.x, p.y, 0); }
    if (e.button === 2) { mouse.rdown = true; onClick && onClick(p.x, p.y, 2); }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rdown = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; if (!t) return;
    const p = toGame(t); mouse.x = p.x; mouse.y = p.y; mouse.down = true;
    onClick && onClick(p.x, p.y, 0);
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0]; if (!t) return;
    const p = toGame(t); mouse.x = p.x; mouse.y = p.y;
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { mouse.down = false; });
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (!keys.has(k)) pressed.add(k);
    keys.add(k);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
}

export function moveVector() {
  let x = 0, y = 0;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (keys.has('w') || keys.has('arrowup')) y -= 1;
  if (keys.has('s') || keys.has('arrowdown')) y += 1;
  const len = Math.hypot(x, y);
  return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}
