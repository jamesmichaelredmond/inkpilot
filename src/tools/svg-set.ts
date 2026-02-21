import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgSet(server: McpServer, context: McpServerContext) {
    server.tool(
        "svg_set",
        `Replace the SVG content with an updated version. Use this to progressively build up a design — each call should include ALL previous elements PLUS new additions. The visual editor updates live with each call.

Best practices for each svg_set call:
- Preserve the <defs> section with all gradients/filters
- Keep the existing group structure (<g id="background">, <g id="main-content">, etc.)
- Add new elements into appropriate groups
- Ensure all text has font-family with fallback fonts
- Keep elements within the viewBox bounds
- Use meaningful IDs on all visual elements

After 2-3 svg_set calls, use svg_validate_and_screenshot to check quality and visually verify progress.`,
        {
            markup: z
                .string()
                .describe(
                    "Complete SVG markup including all elements so far plus new additions"
                ),
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
