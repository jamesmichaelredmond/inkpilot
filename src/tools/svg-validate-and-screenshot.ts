import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
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
            description:
                "Validate the SVG and/or render a PNG screenshot. Default runs both. Use mode to run only one.",
            inputSchema: {
                mode: z
                    .enum(["all", "validate", "screenshot"])
                    .optional()
                    .describe(
                        "all (default): validate + screenshot, validate: structural checks only, screenshot: PNG only"
                    ),
            },
        },
        async ({ mode }) => {
            const effectiveMode = mode || "all";
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

            const contentParts: Array<
                | { type: "text"; text: string }
                | { type: "image"; data: string; mimeType: string }
            > = [];

            // Validation
            if (effectiveMode === "all" || effectiveMode === "validate") {
                const issues = validateSvg(svg);
                const validationText =
                    issues.length === 0
                        ? "Validation: No issues found."
                        : `Validation: ${issues.length} issue(s) found:\n${issues
                              .map((i) => `- [${i.severity}] ${i.message}`)
                              .join("\n")}`;
                contentParts.push({
                    type: "text" as const,
                    text: validationText,
                });
            }

            // Screenshot
            if (effectiveMode === "all" || effectiveMode === "screenshot") {
                let screenshotDone = false;

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
                        screenshotDone = true;
                    }
                } catch {
                    // Webview not available, try resvg fallback
                }

                if (!screenshotDone) {
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
                            text: "(Could not render PNG. Open the editor or install @resvg/resvg-js.)",
                        });
                    }
                }
            }

            return { content: contentParts };
        }
    );
}
