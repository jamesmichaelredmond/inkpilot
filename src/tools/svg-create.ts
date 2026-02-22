import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";
import { detectArtboardColor } from "../artboard";

export function registerSvgCreate(
    server: McpServer,
    context: McpServerContext
) {
    server.registerTool(
        "svg_create",
        {
            description:
                "Create a new SVG and open the visual editor. Build substantially — include <defs>, background, and initial shapes. Use svg_set to refine, then svg_validate_and_screenshot to review. See svg_get_guidelines for text/typography rules.",
            inputSchema: {
                markup: z
                    .string()
                    .describe(
                        "Complete SVG markup with xmlns, viewBox, width, height, <defs>, and content groups"
                    ),
                artboard_color: z
                    .enum(["light", "dark"])
                    .or(z.string().regex(/^#[0-9a-fA-F]{3,6}$/))
                    .optional()
                    .describe(
                        'Artboard background: "light", "dark", or hex color. Auto-detected if omitted.'
                    ),
            },
        },
        async ({ markup, artboard_color }) => {
            context.openEditor();
            context.svgDocument.create(markup);

            // Resolve artboard color
            if (artboard_color) {
                if (artboard_color === "light") {
                    context.svgDocument.artboardColor = "#ffffff";
                } else if (artboard_color === "dark") {
                    context.svgDocument.artboardColor = "#2d2d2d";
                } else {
                    context.svgDocument.artboardColor = artboard_color;
                }
            } else {
                context.svgDocument.artboardColor = detectArtboardColor(markup);
            }

            context.notifyWebview();
            const count = context.svgDocument.listElements().length;
            return {
                content: [
                    {
                        type: "text",
                        text: `SVG created and displayed in editor. ${count} element(s). Use svg_set to progressively add more elements.`,
                    },
                ],
            };
        }
    );
}
