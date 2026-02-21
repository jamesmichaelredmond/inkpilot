import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgSet(server: McpServer, context: McpServerContext) {
    server.registerTool(
        "svg_set",
        {
            description: `Replace the SVG with an updated version. Each call must include ALL previous elements PLUS new additions. The editor updates live.

This should complete the design — include all shapes, text, and details. Aim to finish in 1-2 svg_set calls total.

Critical text rules (the #1 source of SVG bugs):
- ALWAYS: dominant-baseline="central" (without it, text renders ABOVE its y coordinate)
- ALWAYS: text-anchor="middle" for centered text
- ALWAYS: font-family with fallback stack (e.g., "Georgia, 'Times New Roman', serif")
- Center text in shapes mathematically: text x = shape x + width/2, text y = shape y + height/2

After completing the design, call svg_validate_and_screenshot to review.`,
            inputSchema: {
                markup: z
                    .string()
                    .describe(
                        "Complete SVG markup including all elements so far plus new additions"
                    ),
            },
        },
        async ({ markup }) => {
            context.svgDocument.set(markup);
            context.notifyWebview();
            const count = context.svgDocument.listElements().length;
            return {
                content: [
                    {
                        type: "text",
                        text: `SVG updated. ${count} element(s) now in editor.`,
                    },
                ],
            };
        }
    );
}
