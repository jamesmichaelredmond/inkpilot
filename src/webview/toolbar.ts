import type { Canvas } from "fabric";

interface VsCodeApi {
    postMessage(message: unknown): void;
}

let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;
let spaceHeld = false;

export function initToolbar(canvas: Canvas, vscode: VsCodeApi) {
    // Hide the legacy top toolbar — replaced by floating action bar
    const toolbar = document.getElementById("toolbar")!;
    toolbar.style.display = "none";

    // Build floating action bar
    buildActionBar(vscode);

    const container = document.getElementById("canvas-container")!;

    // Make container focusable so it can receive keyboard events in the VSCode webview iframe
    container.setAttribute("tabindex", "0");
    container.style.outline = "none";

    // Auto-focus on load and re-focus when canvas is clicked
    requestAnimationFrame(() => container.focus());
    canvas.on("mouse:down", () => {
        container.focus();
    });

    // --- Space+drag to pan (Photoshop / Illustrator style) ---
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space" && !spaceHeld) {
            e.preventDefault();
            e.stopPropagation();
            spaceHeld = true;
            canvas.defaultCursor = "grab";
            canvas.hoverCursor = "grab";
            canvas.selection = false;
            // Prevent clicking on objects during pan mode
            canvas.skipTargetFind = true;
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") {
            e.preventDefault();
            e.stopPropagation();
            spaceHeld = false;
            if (!isPanning) {
                canvas.defaultCursor = "default";
                canvas.hoverCursor = "move";
                canvas.selection = true;
                canvas.skipTargetFind = false;
            }
        }
    };

    // Listen on container, window, AND document for maximum reliability in VSCode webview
    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // --- Mouse handlers for panning ---
    canvas.on("mouse:down", (opt) => {
        const evt = opt.e as MouseEvent;
        // Pan with: middle mouse, space+left click, or Alt+left click
        if (
            evt.button === 1 ||
            ((spaceHeld || evt.altKey) && evt.button === 0)
        ) {
            isPanning = true;
            lastPanX = evt.clientX;
            lastPanY = evt.clientY;
            canvas.selection = false;
            canvas.skipTargetFind = true;
            canvas.defaultCursor = "grabbing";
            canvas.hoverCursor = "grabbing";
            canvas.discardActiveObject();
            evt.preventDefault();
        }
    });

    canvas.on("mouse:move", (opt) => {
        if (!isPanning) return;
        const evt = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform!;
        vpt[4] += evt.clientX - lastPanX;
        vpt[5] += evt.clientY - lastPanY;
        lastPanX = evt.clientX;
        lastPanY = evt.clientY;
        canvas.requestRenderAll();
    });

    canvas.on("mouse:up", () => {
        if (isPanning) {
            isPanning = false;
            if (!spaceHeld) {
                canvas.defaultCursor = "default";
                canvas.hoverCursor = "move";
                canvas.selection = true;
                canvas.skipTargetFind = false;
            } else {
                canvas.defaultCursor = "grab";
                canvas.hoverCursor = "grab";
            }
        }
    });

    // Scroll wheel / trackpad pinch to zoom (zoom toward cursor)
    canvas.on("mouse:wheel", (opt) => {
        const evt = opt.e as WheelEvent;
        const delta = evt.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        zoom = Math.min(Math.max(zoom, 0.1), 20);
        canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom);
        evt.preventDefault();
        evt.stopPropagation();
    });
}

// ── Floating action bar ──────────────────────────────────────────────

const SAVE_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12.5 14H3.5C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5V3.5C2 3.10218 2.15804 2.72064 2.43934 2.43934C2.72064 2.15804 3.10218 2 3.5 2H10.5L14 5.5V12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11 14V9H5V14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 2V5.5H9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const EXPORT_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 10V12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14H3.5C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5V10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 6.5L8 3.5L11 6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 3.5V10.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function buildActionBar(vscode: VsCodeApi) {
    const container = document.getElementById("canvas-container")!;

    const bar = document.createElement("div");
    bar.className = "action-bar";

    bar.appendChild(
        makeActionBtn(SAVE_ICON, "Save Project", () =>
            vscode.postMessage({ type: "save" })
        )
    );
    bar.appendChild(
        makeActionBtn(EXPORT_ICON, "Export SVG", () =>
            vscode.postMessage({ type: "export" })
        )
    );

    container.appendChild(bar);
}

function makeActionBtn(
    iconHtml: string,
    title: string,
    onClick: () => void
): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.title = title;
    btn.innerHTML = iconHtml;
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick();
    });
    return btn;
}
