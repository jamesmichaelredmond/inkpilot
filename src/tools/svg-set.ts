import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgSet(server: McpServer, context: McpServerContext) {
    server.tool(
        "svg_set",
        "Replace the SVG content. Use this to progressively build up a design — each call should include all previous elements PLUS new ones. The visual editor updates live with each call so the user watches the design take shape.",
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
