import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServerContext } from "../mcp-server";
import { validateSvg } from "./svg-validate";
import { renderSvgToPng } from "../screenshot";

export function registerSvgValidateAndScreenshot(
    server: McpServer,
    context: McpServerContext
) {
    server.registerTool(
        "svg_validate_and_screenshot",
        {
            description: `Validate the current SVG for quality issues AND render a PNG screenshot, both in one call. Returns validation warnings/suggestions followed by the visual screenshot. This is the recommended way to review your work — check both structural quality and visual appearance at once.`,
        },
        async () => {
            const svg = context.svgDocument.getSvg();
            if (!svg) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: "No SVG is currently loaded. Use svg_create first.",
                        },
                    ],
                    isError: true,
                };
            }

            // Run validation
            const issues = validateSvg(svg);
            const validationText =
                issues.length === 0
                    ? "Validation: No issues found."
                    : `Validation: ${issues.length} issue(s) found:\n${issues
                          .map((i) => `- [${i.severity}] ${i.message}`)
                          .join("\n")}`;

            const contentParts: Array<
                | { type: "text"; text: string }
                | { type: "image"; data: string; mimeType: string }
            > = [{ type: "text" as const, text: validationText }];

            // Try webview screenshot first
            try {
                const dataUrl = await context.requestScreenshot();
                if (dataUrl) {
                    const base64 = dataUrl.replace(
                        /^data:image\/png;base64,/,
                        ""
                    );
                    contentParts.push({
                        type: "image" as const,
                        data: base64,
                        mimeType: "image/png",
                    });
                    return { content: contentParts };
                }
            } catch {
                // Webview not available, try resvg fallback
            }

            // Try resvg fallback
            const pngBase64 = await renderSvgToPng(svg);
            if (pngBase64) {
                contentParts.push({
                    type: "image" as const,
                    data: pngBase64,
                    mimeType: "image/png",
                });
            } else {
                contentParts.push({
                    type: "text" as const,
                    text: "(Could not render PNG screenshot. Open the editor or install @resvg/resvg-js.)",
                });
            }

            return { content: contentParts };
        }
    );
}
