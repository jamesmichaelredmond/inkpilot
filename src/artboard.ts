/** Named colors considered "light" (luminance > 200). */
const LIGHT_NAMED_COLORS: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    snow: [255, 250, 250],
    ivory: [255, 255, 240],
    ghostwhite: [248, 248, 255],
    floralwhite: [255, 250, 240],
    mintcream: [245, 255, 250],
    azure: [240, 255, 255],
    aliceblue: [240, 248, 255],
    lavenderblush: [255, 240, 245],
    seashell: [255, 245, 238],
    honeydew: [240, 255, 240],
    linen: [250, 240, 230],
    oldlace: [253, 245, 230],
    whitesmoke: [245, 245, 245],
    beige: [245, 245, 220],
    lightyellow: [255, 255, 224],
    lightcyan: [224, 255, 255],
    lavender: [230, 230, 250],
    cornsilk: [255, 248, 220],
    lemonchiffon: [255, 250, 205],
    papayawhip: [255, 239, 213],
    blanchedalmond: [255, 235, 205],
    mistyrose: [255, 228, 225],
    antiquewhite: [250, 235, 215],
};

function parseHexColor(hex: string): [number, number, number] | null {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
        return [
            parseInt(hex[0] + hex[0], 16),
            parseInt(hex[1] + hex[1], 16),
            parseInt(hex[2] + hex[2], 16),
        ];
    }
    if (hex.length === 6) {
        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
        ];
    }
    return null;
}

function luminance(r: number, g: number, b: number): number {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Scan SVG markup for fill and stop-color values and auto-detect
 * whether the artboard should be light or dark.
 * Returns "#2d2d2d" (dark) if content is mostly light, "#ffffff" otherwise.
 */
export function detectArtboardColor(svgMarkup: string): string {
    const colorPattern = /(?:fill|stop-color)\s*=\s*"([^"]+)"/gi;
    const luminances: number[] = [];

    let match: RegExpExecArray | null;
    while ((match = colorPattern.exec(svgMarkup)) !== null) {
        const raw = match[1].trim().toLowerCase();

        // Skip non-color values
        if (raw === "none" || raw === "transparent" || raw.startsWith("url(") || raw === "currentcolor") {
            continue;
        }

        // Try hex
        if (raw.startsWith("#")) {
            const rgb = parseHexColor(raw);
            if (rgb) {
                luminances.push(luminance(...rgb));
                continue;
            }
        }

        // Try named colors
        const named = LIGHT_NAMED_COLORS[raw];
        if (named) {
            luminances.push(luminance(...named));
        }
        // Unknown named colors are skipped — they're likely dark or mid-tone
    }

    if (luminances.length === 0) return "#ffffff";

    const avg = luminances.reduce((a, b) => a + b, 0) / luminances.length;
    return avg > 200 ? "#2d2d2d" : "#ffffff";
}
