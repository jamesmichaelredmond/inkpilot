import { DOMParser } from "linkedom";
import { EventEmitter } from "events";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Tags that are structural/non-visual and should not get auto-generated IDs. */
const STRUCTURAL_TAGS = new Set([
    "defs",
    "desc",
    "title",
    "metadata",
    "symbol",
    "linearGradient",
    "radialGradient",
    "stop",
    "clipPath",
    "mask",
    "pattern",
    "filter",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feFlood",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "feSpecularLighting",
    "feTile",
    "feTurbulence",
]);

export interface SvgElementInfo {
    id: string;
    tag: string;
    attributes: Record<string, string>;
}

export class SvgDocument extends EventEmitter {
    private parser = new DOMParser();
    private doc: ReturnType<DOMParser["parseFromString"]> | null = null;
    private idCounter = 0;

    /** Path to the current .inkp project file (null if unsaved). */
    projectPath: string | null = null;
    /** Friendly name for the project. */
    projectName = "Untitled";
    /** Artboard background color (purely visual, never exported). */
    artboardColor = "#ffffff";

    get isEmpty(): boolean {
        return this.doc === null || !this.doc.querySelector("svg");
    }

    setProject(path: string, name?: string): void {
        this.projectPath = path;
        if (name) this.projectName = name;
        this.emit("project");
    }

    clearProject(): void {
        this.projectPath = null;
        this.projectName = "Untitled";
        this.emit("project");
    }

    create(svgMarkup: string): void {
        const cleaned = svgMarkup.replace(/<\?xml[^?]*\?>\s*/g, "");
        this.doc = this.parser.parseFromString(cleaned, "image/svg+xml");
        this.ensureIds();
        this.emit("change", this.getSvg());
    }

    set(svgMarkup: string): void {
        this.create(svgMarkup);
    }

    getSvg(): string {
        if (!this.doc) return "";
        const svgEl = this.doc.querySelector("svg");
        return svgEl ? svgEl.outerHTML : "";
    }

    addElement(tag: string, attributes: Record<string, string>): string {
        if (!this.doc || !this.doc.querySelector("svg")) {
            this.create(
                '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"></svg>'
            );
        }
        const svgEl = this.doc!.querySelector("svg")!;
        const el = this.doc!.createElementNS(SVG_NS, tag, null);

        const id = attributes.id || this.generateId();
        el.setAttribute("id", id);

        for (const [key, value] of Object.entries(attributes)) {
            if (key !== "id") {
                el.setAttribute(key, value);
            }
        }

        svgEl.appendChild(el);
        this.emit("change", this.getSvg());
        return id;
    }

    updateElement(id: string, attributes: Record<string, string>): boolean {
        if (!this.doc) return false;
        const el = this.doc.getElementById(id);
        if (!el) return false;

        for (const [key, value] of Object.entries(attributes)) {
            if (value === "") {
                el.removeAttribute(key);
            } else {
                el.setAttribute(key, value);
            }
        }

        this.emit("change", this.getSvg());
        return true;
    }

    removeElement(id: string): boolean {
        if (!this.doc) return false;
        const el = this.doc.getElementById(id);
        if (!el) return false;
        el.parentNode?.removeChild(el);
        this.emit("change", this.getSvg());
        return true;
    }

    listElements(): SvgElementInfo[] {
        if (!this.doc) return [];
        const svgEl = this.doc.querySelector("svg");
        if (!svgEl) return [];

        const elements: SvgElementInfo[] = [];
        const children = svgEl.querySelectorAll("*");

        for (const child of children) {
            const attrs: Record<string, string> = {};
            if ((child as any).attributes) {
                for (const attr of (child as any).attributes) {
                    attrs[attr.name] = attr.value;
                }
            }
            elements.push({
                id: (child as any).id || "",
                tag: child.tagName,
                attributes: attrs,
            });
        }

        return elements;
    }

    /** Serialize current state into .inkp project JSON. */
    toProjectJson(name?: string): string {
        return JSON.stringify(
            {
                inkpilot: "0.2.0",
                name: name ?? this.projectName,
                svg: this.getSvg(),
                artboard: { color: this.artboardColor },
            },
            null,
            2
        );
    }

    /** Parse .inkp project JSON and load the SVG. Returns the project name and artboard color. */
    static fromProjectJson(
        json: string
    ): { svg: string; name: string; artboardColor: string } | null {
        try {
            const project = JSON.parse(json) as {
                name?: string;
                svg?: string;
                artboard?: { color?: string };
            };
            if (!project.svg) return null;
            return {
                svg: project.svg,
                name: project.name || "Untitled",
                artboardColor: project.artboard?.color || "#ffffff",
            };
        } catch {
            return null;
        }
    }

    private generateId(): string {
        return `inkp-${++this.idCounter}`;
    }

    private ensureIds(): void {
        if (!this.doc) return;
        const svgEl = this.doc.querySelector("svg");
        if (!svgEl) return;

        for (const child of svgEl.querySelectorAll("*")) {
            if (!(child as any).id && !STRUCTURAL_TAGS.has(child.tagName)) {
                (child as any).id = this.generateId();
            }
        }
    }
}
