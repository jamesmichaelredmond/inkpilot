import {
    Canvas,
    loadSVGFromString,
    FabricObject,
    Rect,
    Shadow,
    util,
} from "fabric";
import { initToolbar } from "./toolbar";
import { initProperties } from "./properties";

const vscode = acquireVsCodeApi();

let canvas: Canvas;
let isUpdatingFromHost = false;

function init() {
    const canvasEl = document.getElementById("canvas") as HTMLCanvasElement;
    const container = document.getElementById("canvas-container")!;

    canvas = new Canvas(canvasEl, {
        width: container.clientWidth,
        height: container.clientHeight,
        // No backgroundColor — the CSS workspace grey shows through the transparent canvas
        selection: true,
        preserveObjectStacking: true,
    });

    initToolbar(canvas, vscode);
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
    window.addEventListener("message", async (event) => {
        const message = event.data;
        switch (message.type) {
            case "updateSvg":
                await loadSvg(message.svg);
                break;
            case "requestScreenshot":
                sendScreenshot();
                break;
        }
    });

    // Sync changes back to extension host on user interaction
    canvas.on("object:modified", () => {
        if (!isUpdatingFromHost) {
            sendSvgToHost();
        }
    });
    canvas.on("object:removed", () => {
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
            (o): o is FabricObject => o !== null
        );

        // Parse SVG dimensions for artboard
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
        const svgEl = svgDoc.querySelector("svg");

        let svgW = 0;
        let svgH = 0;
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

        // Add artboard — a white rectangle representing the document area (like Illustrator)
        if (svgW > 0 && svgH > 0) {
            const artboard = new Rect({
                left: 0,
                top: 0,
                width: svgW,
                height: svgH,
                fill: "#ffffff",
                selectable: false,
                evented: false,
                hoverCursor: "default",
                shadow: new Shadow({
                    color: "rgba(0,0,0,0.25)",
                    blur: 12,
                    offsetX: 0,
                    offsetY: 2,
                }),
            });
            (artboard as any).__isArtboard = true;
            canvas.add(artboard);
        }

        // Add SVG objects on top of artboard
        if (objects.length > 0) {
            for (const obj of objects) {
                canvas.add(obj);
            }
        }

        // Always keep canvas filling the container
        const containerEl = document.getElementById("canvas-container")!;
        canvas.setDimensions({
            width: containerEl.clientWidth,
            height: containerEl.clientHeight,
        });

        // Center and fit the SVG content in the viewport
        if (svgW > 0 && svgH > 0) {
            const padding = 60;
            const scaleX = (containerEl.clientWidth - padding * 2) / svgW;
            const scaleY = (containerEl.clientHeight - padding * 2) / svgH;
            const zoom = Math.min(scaleX, scaleY, 3); // don't zoom beyond 3x
            const offsetX = (containerEl.clientWidth - svgW * zoom) / 2;
            const offsetY = (containerEl.clientHeight - svgH * zoom) / 2;
            canvas.setViewportTransform([zoom, 0, 0, zoom, offsetX, offsetY]);
        }

        canvas.renderAll();
    } catch (e) {
        console.error("Failed to load SVG:", e);
    }

    isUpdatingFromHost = false;
}

function sendSvgToHost() {
    // Temporarily remove artboard so it's not exported in the SVG
    const objects = canvas.getObjects();
    const artboard = objects.find((o: any) => o.__isArtboard);

    if (artboard) canvas.remove(artboard);
    const svg = canvas.toSVG();
    if (artboard) {
        canvas.add(artboard);
        canvas.sendObjectToBack(artboard);
        canvas.renderAll();
    }

    vscode.postMessage({ type: "svgChanged", svg });
}

function sendScreenshot() {
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
    vscode.postMessage({ type: "screenshot", dataUrl });
}

init();
