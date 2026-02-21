import { initToolbar } from "./toolbar";

declare function acquireVsCodeApi(): { postMessage(message: unknown): void };
const vscode = acquireVsCodeApi();

let svgPreview: HTMLImageElement;
let container: HTMLElement;

let currentSvgString = "";
let svgW = 0;
let svgH = 0;

// Zoom/pan state
let zoom = 1;
let panX = 0;
let panY = 0;

// Pan interaction state
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;
let spaceHeld = false;

function init() {
    svgPreview = document.getElementById("svg-preview") as HTMLImageElement;
    container = document.getElementById("canvas-container")!;

    // Make container focusable for keyboard events
    container.setAttribute("tabindex", "0");
    container.style.outline = "none";
    requestAnimationFrame(() => container.focus());

    initToolbar(vscode);

    // Handle messages from extension host
    window.addEventListener("message", async (event) => {
        const message = event.data;
        switch (message.type) {
            case "updateSvg":
                loadSvg(message.svg);
                break;
            case "requestScreenshot":
                sendScreenshot();
                break;
        }
    });

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
        if (svgW > 0 && svgH > 0) {
            fitToViewport();
        }
    });
    resizeObserver.observe(container);

    // --- Zoom (scroll wheel toward cursor) ---
    container.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY;
        const newZoom = Math.min(Math.max(zoom * 0.999 ** delta, 0.1), 20);

        // Zoom toward cursor position
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        panX = cursorX - (cursorX - panX) * (newZoom / zoom);
        panY = cursorY - (cursorY - panY) * (newZoom / zoom);
        zoom = newZoom;

        applyTransform();
    }, { passive: false });

    // --- Pan (Space+drag or middle-mouse-drag) ---
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space" && !spaceHeld) {
            e.preventDefault();
            e.stopPropagation();
            spaceHeld = true;
            container.style.cursor = "grab";
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") {
            e.preventDefault();
            e.stopPropagation();
            spaceHeld = false;
            if (!isPanning) {
                container.style.cursor = "default";
            }
        }
    };
    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    container.addEventListener("mousedown", (e) => {
        container.focus();
        // Pan with: middle mouse, Space+left click, or Alt+left click
        if (
            e.button === 1 ||
            ((spaceHeld || e.altKey) && e.button === 0)
        ) {
            isPanning = true;
            lastPanX = e.clientX;
            lastPanY = e.clientY;
            container.style.cursor = "grabbing";
            e.preventDefault();
        }
    });

    container.addEventListener("mousemove", (e) => {
        if (!isPanning) return;
        panX += e.clientX - lastPanX;
        panY += e.clientY - lastPanY;
        lastPanX = e.clientX;
        lastPanY = e.clientY;
        applyTransform();
    });

    const endPan = () => {
        if (isPanning) {
            isPanning = false;
            container.style.cursor = spaceHeld ? "grab" : "default";
        }
    };
    container.addEventListener("mouseup", endPan);
    container.addEventListener("mouseleave", endPan);
}

function loadSvg(svgString: string) {
    if (!svgString) return;
    currentSvgString = svgString;

    // Parse SVG dimensions
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = svgDoc.querySelector("svg");

    svgW = 0;
    svgH = 0;
    if (svgEl) {
        svgW = parseFloat(svgEl.getAttribute("width") || "0");
        svgH = parseFloat(svgEl.getAttribute("height") || "0");
        // Fall back to viewBox dimensions
        if ((svgW <= 0 || svgH <= 0) && svgEl.getAttribute("viewBox")) {
            const vb = svgEl.getAttribute("viewBox")!.split(/[\s,]+/);
            if (vb.length === 4) {
                svgW = parseFloat(vb[2]);
                svgH = parseFloat(vb[3]);
            }
        }
    }

    // Set native SVG rendering via data URL
    svgPreview.src =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

    // Set intrinsic dimensions so the img has correct aspect ratio
    if (svgW > 0 && svgH > 0) {
        svgPreview.style.width = `${svgW}px`;
        svgPreview.style.height = `${svgH}px`;
    }

    fitToViewport();
}

function fitToViewport() {
    if (svgW <= 0 || svgH <= 0) return;
    const padding = 60;
    const scaleX = (container.clientWidth - padding * 2) / svgW;
    const scaleY = (container.clientHeight - padding * 2) / svgH;
    zoom = Math.min(scaleX, scaleY, 3);
    panX = (container.clientWidth - svgW * zoom) / 2;
    panY = (container.clientHeight - svgH * zoom) / 2;
    applyTransform();
}

function applyTransform() {
    svgPreview.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

function sendScreenshot() {
    if (!currentSvgString || svgW <= 0 || svgH <= 0) {
        vscode.postMessage({ type: "screenshot", dataUrl: "" });
        return;
    }

    // Render SVG natively via offscreen canvas at 2x for crispness
    const scale = 2;
    const w = svgW * scale;
    const h = svgH * scale;

    const img = new Image();
    img.onload = () => {
        const offscreen = document.createElement("canvas");
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        vscode.postMessage({
            type: "screenshot",
            dataUrl: offscreen.toDataURL("image/png"),
        });
    };
    img.onerror = () => {
        vscode.postMessage({ type: "screenshot", dataUrl: "" });
    };
    img.src =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(currentSvgString);
}

init();
