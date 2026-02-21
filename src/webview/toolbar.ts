import type { Canvas } from 'fabric';

type ToolMode = 'pointer' | 'pan';

let currentMode: ToolMode = 'pointer';
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;

export function initToolbar(canvas: Canvas) {
  const toolbar = document.getElementById('toolbar')!;

  // Pointer tool
  const pointerBtn = createButton('pointer', 'Pointer (V)', true);
  pointerBtn.addEventListener('click', () => {
    setMode('pointer', canvas);
    setActive(pointerBtn);
  });

  // Pan tool
  const panBtn = createButton('pan', 'Pan (H)');
  panBtn.addEventListener('click', () => {
    setMode('pan', canvas);
    setActive(panBtn);
  });

  // Zoom in
  const zoomInBtn = createButton('zoom-in', 'Zoom In (+)');
  zoomInBtn.addEventListener('click', () => {
    const zoom = canvas.getZoom() * 1.2;
    canvas.setZoom(Math.min(zoom, 10));
    canvas.renderAll();
  });

  // Zoom out
  const zoomOutBtn = createButton('zoom-out', 'Zoom Out (-)');
  zoomOutBtn.addEventListener('click', () => {
    const zoom = canvas.getZoom() / 1.2;
    canvas.setZoom(Math.max(zoom, 0.1));
    canvas.renderAll();
  });

  // Zoom reset
  const zoomResetBtn = createButton('zoom-reset', 'Reset Zoom (0)');
  zoomResetBtn.addEventListener('click', () => {
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll();
  });

  toolbar.append(pointerBtn, panBtn, zoomInBtn, zoomOutBtn, zoomResetBtn);

  // Pan mode mouse handlers
  canvas.on('mouse:down', (opt) => {
    if (currentMode === 'pan') {
      isPanning = true;
      const evt = opt.e as MouseEvent;
      lastPanX = evt.clientX;
      lastPanY = evt.clientY;
      canvas.selection = false;
    }
  });

  canvas.on('mouse:move', (opt) => {
    if (isPanning && currentMode === 'pan') {
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform!;
      vpt[4] += evt.clientX - lastPanX;
      vpt[5] += evt.clientY - lastPanY;
      lastPanX = evt.clientX;
      lastPanY = evt.clientY;
      canvas.requestRenderAll();
    }
  });

  canvas.on('mouse:up', () => {
    isPanning = false;
  });

  // Scroll wheel zoom
  canvas.on('mouse:wheel', (opt) => {
    const evt = opt.e as WheelEvent;
    const delta = evt.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    zoom = Math.min(Math.max(zoom, 0.1), 10);
    canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom);
    evt.preventDefault();
    evt.stopPropagation();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    switch (e.key.toLowerCase()) {
      case 'v':
        setMode('pointer', canvas);
        setActive(pointerBtn);
        break;
      case 'h':
        setMode('pan', canvas);
        setActive(panBtn);
        break;
      case '=':
      case '+':
        zoomInBtn.click();
        break;
      case '-':
        zoomOutBtn.click();
        break;
      case '0':
        zoomResetBtn.click();
        break;
    }
  });
}

function setMode(mode: ToolMode, canvas: Canvas) {
  currentMode = mode;
  if (mode === 'pointer') {
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
  } else {
    canvas.selection = false;
    canvas.defaultCursor = 'grab';
    canvas.hoverCursor = 'grab';
    canvas.discardActiveObject();
    canvas.renderAll();
  }
}

function createButton(id: string, title: string, active = false): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = `tool-${id}`;
  btn.className = `toolbar-btn${active ? ' active' : ''}`;
  btn.title = title;
  btn.textContent = getIcon(id);
  return btn;
}

function setActive(btn: HTMLButtonElement) {
  document.querySelectorAll('.toolbar-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
}

function getIcon(id: string): string {
  switch (id) {
    case 'pointer': return '\u25E6'; // pointer
    case 'pan': return '\u2630';     // pan
    case 'zoom-in': return '+';
    case 'zoom-out': return '\u2212';
    case 'zoom-reset': return '\u2316';
    default: return '?';
  }
}
