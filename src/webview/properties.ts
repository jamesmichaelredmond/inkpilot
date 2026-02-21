import type { Canvas, FabricObject } from 'fabric';

interface VsCodeApi {
  postMessage(message: unknown): void;
}

let panel: HTMLElement;
let currentObject: FabricObject | null = null;

export function initProperties(canvas: Canvas, _vscode: VsCodeApi) {
  panel = document.getElementById('properties-panel')!;
  renderEmpty();

  canvas.on('selection:created', (e) => {
    currentObject = e.selected?.[0] ?? null;
    renderProperties(canvas);
  });

  canvas.on('selection:updated', (e) => {
    currentObject = e.selected?.[0] ?? null;
    renderProperties(canvas);
  });

  canvas.on('selection:cleared', () => {
    currentObject = null;
    renderEmpty();
  });

  canvas.on('object:modified', () => {
    if (currentObject) {
      renderProperties(canvas);
    }
  });
}

function renderEmpty() {
  panel.innerHTML = '<div class="props-empty">Select an element to edit properties</div>';
}

function renderProperties(canvas: Canvas) {
  if (!currentObject) {
    renderEmpty();
    return;
  }

  const obj = currentObject;
  panel.innerHTML = '';

  const title = document.createElement('div');
  title.className = 'props-title';
  title.textContent = obj.type || 'Object';
  panel.appendChild(title);

  // Position
  addNumberField('X', obj.left ?? 0, (v) => { obj.set('left', v); canvas.renderAll(); });
  addNumberField('Y', obj.top ?? 0, (v) => { obj.set('top', v); canvas.renderAll(); });

  // Size
  addNumberField('Width', (obj.width ?? 0) * (obj.scaleX ?? 1), (v) => {
    obj.set('scaleX', v / (obj.width ?? 1));
    canvas.renderAll();
  });
  addNumberField('Height', (obj.height ?? 0) * (obj.scaleY ?? 1), (v) => {
    obj.set('scaleY', v / (obj.height ?? 1));
    canvas.renderAll();
  });

  // Rotation
  addNumberField('Rotation', obj.angle ?? 0, (v) => { obj.set('angle', v); canvas.renderAll(); });

  // Opacity
  addRangeField('Opacity', obj.opacity ?? 1, 0, 1, 0.01, (v) => {
    obj.set('opacity', v);
    canvas.renderAll();
  });

  // Fill
  addColorField('Fill', asString(obj.fill) || '#000000', (v) => {
    obj.set('fill', v);
    canvas.renderAll();
  });

  // Stroke
  addColorField('Stroke', asString(obj.stroke) || '#000000', (v) => {
    obj.set('stroke', v);
    canvas.renderAll();
  });

  // Stroke width
  addNumberField('Stroke W', obj.strokeWidth ?? 0, (v) => {
    obj.set('strokeWidth', v);
    canvas.renderAll();
  });
}

function addNumberField(label: string, value: number, onChange: (v: number) => void) {
  const row = createRow(label);
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'props-input';
  input.value = String(Math.round(value * 100) / 100);
  input.addEventListener('change', () => {
    const v = parseFloat(input.value);
    if (!isNaN(v)) onChange(v);
  });
  row.appendChild(input);
  panel.appendChild(row);
}

function addColorField(label: string, value: string, onChange: (v: string) => void) {
  const row = createRow(label);
  const input = document.createElement('input');
  input.type = 'color';
  input.className = 'props-color';
  input.value = toHexColor(value);
  input.addEventListener('input', () => {
    onChange(input.value);
  });
  row.appendChild(input);
  panel.appendChild(row);
}

function addRangeField(
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (v: number) => void,
) {
  const row = createRow(label);
  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'props-range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  const valSpan = document.createElement('span');
  valSpan.className = 'props-range-val';
  valSpan.textContent = String(Math.round(value * 100));
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    valSpan.textContent = String(Math.round(v * 100));
    onChange(v);
  });
  row.appendChild(input);
  row.appendChild(valSpan);
  panel.appendChild(row);
}

function createRow(label: string): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'props-row';
  const lbl = document.createElement('label');
  lbl.className = 'props-label';
  lbl.textContent = label;
  row.appendChild(lbl);
  return row;
}

function asString(val: unknown): string {
  if (typeof val === 'string') return val;
  return '';
}

function toHexColor(color: string): string {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    return color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
  }
  // Try parsing rgb(r,g,b)
  const rgb = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgb) {
    const hex = (n: string) => parseInt(n, 10).toString(16).padStart(2, '0');
    return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
  }
  return '#000000';
}
