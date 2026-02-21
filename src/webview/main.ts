import { Canvas, loadSVGFromString, FabricObject, util } from 'fabric';
import { initToolbar } from './toolbar';
import { initProperties } from './properties';

const vscode = acquireVsCodeApi();

let canvas: Canvas;
let isUpdatingFromHost = false;

function init() {
  const canvasEl = document.getElementById('canvas') as HTMLCanvasElement;
  const container = document.getElementById('canvas-container')!;

  canvas = new Canvas(canvasEl, {
    width: container.clientWidth,
    height: container.clientHeight,
    backgroundColor: '#ffffff',
    selection: true,
    preserveObjectStacking: true,
  });

  initToolbar(canvas);
  initProperties(canvas, vscode);

  // Resize canvas when container resizes
  const resizeObserver = new ResizeObserver(() => {
    canvas.setDimensions({
      width: container.clientWidth,
      height: container.clientHeight,
    });
    canvas.renderAll();
  });
  resizeObserver.observe(container);

  // Handle messages from extension host
  window.addEventListener('message', async (event) => {
    const message = event.data;
    switch (message.type) {
      case 'updateSvg':
        await loadSvg(message.svg);
        break;
      case 'requestScreenshot':
        sendScreenshot();
        break;
    }
  });

  // Sync changes back to extension host on user interaction
  canvas.on('object:modified', () => {
    if (!isUpdatingFromHost) {
      sendSvgToHost();
    }
  });
  canvas.on('object:removed', () => {
    if (!isUpdatingFromHost) {
      sendSvgToHost();
    }
  });
}

async function loadSvg(svgString: string) {
  if (!svgString) return;
  isUpdatingFromHost = true;
  canvas.clear();

  try {
    const result = await loadSVGFromString(svgString);
    const objects: FabricObject[] = result.objects.filter(
      (o): o is FabricObject => o !== null,
    );

    if (objects.length > 0) {
      for (const obj of objects) {
        canvas.add(obj);
      }
    }

    // Try to set canvas size from SVG viewBox or width/height
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = svgDoc.querySelector('svg');
    if (svgEl) {
      const w = svgEl.getAttribute('width');
      const h = svgEl.getAttribute('height');
      if (w && h) {
        const numW = parseInt(w, 10);
        const numH = parseInt(h, 10);
        if (numW > 0 && numH > 0) {
          canvas.setDimensions({ width: numW, height: numH });
        }
      }
    }

    canvas.renderAll();
  } catch (e) {
    console.error('Failed to load SVG:', e);
  }

  isUpdatingFromHost = false;
}

function sendSvgToHost() {
  const svg = canvas.toSVG();
  vscode.postMessage({ type: 'svgChanged', svg });
}

function sendScreenshot() {
  const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
  vscode.postMessage({ type: 'screenshot', dataUrl });
}

init();
