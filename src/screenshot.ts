/**
 * Optional SVG-to-PNG rendering using @resvg/resvg-js.
 * Falls back gracefully if the native module is not installed.
 */
export async function renderSvgToPng(
    svgString: string
): Promise<string | null> {
    try {
        const { Resvg } = await import("@resvg/resvg-js");
        const resvg = new Resvg(svgString, {
            fitTo: { mode: "width" as const, value: 800 },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();
        return Buffer.from(pngBuffer).toString("base64");
    } catch {
        return null;
    }
}
