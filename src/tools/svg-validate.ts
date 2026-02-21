import { DOMParser } from "linkedom";

export interface ValidationIssue {
    severity: "error" | "warning" | "suggestion";
    message: string;
    element?: string;
}

export function validateSvg(svgMarkup: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, "image/svg+xml");
    const svgEl = doc.querySelector("svg");

    if (!svgEl) {
        issues.push({
            severity: "error",
            message: "No <svg> root element found.",
        });
        return issues;
    }

    // 1. Check xmlns
    if (!svgEl.getAttribute("xmlns")) {
        issues.push({
            severity: "error",
            message:
                'Missing xmlns attribute. Add xmlns="http://www.w3.org/2000/svg" to the <svg> element.',
        });
    }

    // 2. Check viewBox
    const viewBox = svgEl.getAttribute("viewBox");
    if (!viewBox) {
        issues.push({
            severity: "error",
            message:
                "Missing viewBox attribute on <svg>. This is critical for scalable rendering.",
        });
    }

    // 3. Parse viewBox dimensions for bounds checking
    let vbX = 0,
        vbY = 0,
        vbW = 0,
        vbH = 0;
    if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts.every((n: number) => !isNaN(n))) {
            [vbX, vbY, vbW, vbH] = parts;
        } else {
            issues.push({
                severity: "warning",
                message: `Invalid viewBox format: "${viewBox}". Expected "x y width height".`,
            });
        }
    }

    // 4. Check for <defs> section
    const defs = svgEl.querySelector("defs");
    const hasGradients = svgEl.querySelector("linearGradient, radialGradient");
    const hasFilters = svgEl.querySelector("filter");
    if ((hasGradients || hasFilters) && !defs) {
        issues.push({
            severity: "warning",
            message:
                "Gradients or filters found outside of <defs>. Move them into a <defs> block.",
        });
    }

    // 5. Check text elements for font-family
    const textElements = svgEl.querySelectorAll("text");
    for (const text of textElements) {
        const fontFamily = text.getAttribute("font-family");
        const style = text.getAttribute("style") || "";
        if (!fontFamily && !style.includes("font-family")) {
            const id = text.getAttribute("id") || text.tagName;
            issues.push({
                severity: "warning",
                message: `Text element "${id}" has no font-family. Add font-family with fallbacks (e.g., "Inter, Helvetica, Arial, sans-serif").`,
                element: id,
            });
        }
    }

    // 6. Check for elements outside viewBox bounds
    if (vbW > 0 && vbH > 0) {
        const checkable = svgEl.querySelectorAll(
            "rect, circle, ellipse, image"
        );
        for (const el of checkable) {
            const tag = el.tagName;
            const id = el.getAttribute("id") || tag;

            // Skip elements inside transformed groups
            const parent = el.parentNode as any;
            if (parent?.tagName === "g" && parent.getAttribute("transform")) {
                continue;
            }

            let elX = 0,
                elY = 0,
                elRight = 0,
                elBottom = 0;

            if (tag === "rect" || tag === "image") {
                elX = parseFloat(el.getAttribute("x") || "0");
                elY = parseFloat(el.getAttribute("y") || "0");
                const w = parseFloat(el.getAttribute("width") || "0");
                const h = parseFloat(el.getAttribute("height") || "0");
                elRight = elX + w;
                elBottom = elY + h;
            } else if (tag === "circle") {
                const cx = parseFloat(el.getAttribute("cx") || "0");
                const cy = parseFloat(el.getAttribute("cy") || "0");
                const r = parseFloat(el.getAttribute("r") || "0");
                elX = cx - r;
                elY = cy - r;
                elRight = cx + r;
                elBottom = cy + r;
            } else if (tag === "ellipse") {
                const cx = parseFloat(el.getAttribute("cx") || "0");
                const cy = parseFloat(el.getAttribute("cy") || "0");
                const rx = parseFloat(el.getAttribute("rx") || "0");
                const ry = parseFloat(el.getAttribute("ry") || "0");
                elX = cx - rx;
                elY = cy - ry;
                elRight = cx + rx;
                elBottom = cy + ry;
            }

            if (
                elRight > vbX + vbW + 1 ||
                elBottom > vbY + vbH + 1 ||
                elX < vbX - 1 ||
                elY < vbY - 1
            ) {
                issues.push({
                    severity: "warning",
                    message: `Element "${id}" appears to extend outside the viewBox bounds (${viewBox}). It may be clipped.`,
                    element: id,
                });
            }
        }
    }

    // 7. Check for elements at identical positions
    const positionMap = new Map<string, string[]>();
    const positioned = svgEl.querySelectorAll("rect, circle, ellipse");
    for (const el of positioned) {
        const tag = el.tagName;
        const id = el.getAttribute("id") || tag;
        let key = "";
        if (tag === "rect") {
            key = `rect:${el.getAttribute("x")}:${el.getAttribute("y")}`;
        } else if (tag === "circle") {
            key = `circle:${el.getAttribute("cx")}:${el.getAttribute("cy")}`;
        } else if (tag === "ellipse") {
            key = `ellipse:${el.getAttribute("cx")}:${el.getAttribute("cy")}`;
        }
        if (key) {
            const existing = positionMap.get(key) || [];
            existing.push(id);
            positionMap.set(key, existing);
        }
    }
    for (const [, ids] of positionMap) {
        if (ids.length > 1) {
            issues.push({
                severity: "suggestion",
                message: `Multiple elements at the same position: ${ids.join(", ")}. This may be intentional (layering) or accidental (duplicates).`,
            });
        }
    }

    // 8. Check for empty groups
    const groups = svgEl.querySelectorAll("g");
    for (const g of groups) {
        if (g.children.length === 0 && !g.textContent?.trim()) {
            const id = g.getAttribute("id") || "unnamed group";
            issues.push({
                severity: "suggestion",
                message: `Empty group "${id}" — add content or remove it.`,
                element: id,
            });
        }
    }

    // 9. Check for unused defs
    if (defs) {
        const definedIds: string[] = [];
        for (const child of Array.from(defs.children) as any[]) {
            const id = child.getAttribute("id");
            if (id) definedIds.push(id);
        }
        const markupWithoutDefs = svgMarkup.replace(
            /<defs[\s\S]*?<\/defs>/,
            ""
        );
        for (const defId of definedIds) {
            const urlRef = `url(#${defId})`;
            const hrefRef = `#${defId}`;
            if (
                !markupWithoutDefs.includes(urlRef) &&
                !markupWithoutDefs.includes(hrefRef)
            ) {
                issues.push({
                    severity: "suggestion",
                    message: `Definition "${defId}" in <defs> is not referenced anywhere. Remove unused definitions.`,
                    element: defId,
                });
            }
        }
    }

    // 10. Check for visual elements without IDs
    const visualElements = svgEl.querySelectorAll(
        "rect, circle, ellipse, line, polygon, polyline, path, text"
    );
    let noIdCount = 0;
    for (const el of visualElements) {
        if (!el.getAttribute("id")) {
            noIdCount++;
        }
    }
    if (noIdCount > 0) {
        issues.push({
            severity: "suggestion",
            message: `${noIdCount} visual element(s) have no ID attribute. Add meaningful IDs for easier editing.`,
        });
    }

    // 11. Check width/height
    const width = svgEl.getAttribute("width");
    const height = svgEl.getAttribute("height");
    if (!width || !height) {
        issues.push({
            severity: "suggestion",
            message:
                "Consider adding explicit width and height attributes to the <svg> element for consistent default sizing.",
        });
    }

    // 12. Check <textPath> elements for missing or broken href
    const textPaths = svgEl.querySelectorAll("textPath");
    for (const tp of textPaths) {
        const href = tp.getAttribute("href") || tp.getAttribute("xlink:href");
        if (!href) {
            issues.push({
                severity: "error",
                message: `<textPath> element has no href attribute. Add href="#pathId" referencing a <path> in <defs>.`,
            });
        } else {
            const pathId = href.replace(/^#/, "");
            const referencedPath = svgEl.querySelector(`#${pathId}`);
            if (!referencedPath) {
                issues.push({
                    severity: "error",
                    message: `<textPath> references "#${pathId}" but no element with that ID exists. Define the arc path in <defs>.`,
                });
            } else if (referencedPath.tagName !== "path") {
                issues.push({
                    severity: "warning",
                    message: `<textPath> references "#${pathId}" which is a <${referencedPath.tagName}>, not a <path>. textPath works best with <path> elements.`,
                });
            }
        }
    }

    // 13. Check <textPath> for missing centering attributes
    for (const tp of textPaths) {
        const startOffset = tp.getAttribute("startOffset");
        const textAnchor = tp.getAttribute("text-anchor");
        const parentText = tp.parentNode as any;
        const parentAnchor = parentText?.getAttribute?.("text-anchor");

        if (!startOffset && !(textAnchor || parentAnchor)) {
            issues.push({
                severity: "warning",
                message: `<textPath> has no startOffset or text-anchor. Text will bunch at the start of the path. Add startOffset="50%" and text-anchor="middle" to center it.`,
            });
        }
    }

    // 14. Check for textPath on a full-circle path (causes overlapping text)
    if (defs) {
        for (const tp of textPaths) {
            const href = tp.getAttribute("href") || tp.getAttribute("xlink:href");
            if (!href) continue;
            const pathId = href.replace(/^#/, "");
            const pathEl = defs.querySelector(`#${pathId}`);
            if (!pathEl) continue;
            const d = pathEl.getAttribute("d") || "";
            // Detect full circles: two arc commands that form a complete circle
            // e.g., M cx,cy-r A r,r 0 1,1 cx,cy+r A r,r 0 1,1 cx,cy-r
            const arcCount = (d.match(/[Aa]\s/g) || []).length;
            if (arcCount >= 2) {
                issues.push({
                    severity: "warning",
                    message: `<textPath> references path "#${pathId}" which appears to be a full circle (${arcCount} arc commands). Use a semicircular arc instead — full circles cause text to overlap. See guidelines section 9.`,
                    element: pathId,
                });
            }
        }
    }

    return issues;
}
