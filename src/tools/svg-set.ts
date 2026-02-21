import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgSet(server: McpServer, context: McpServerContext) {
    server.registerTool(
        "svg_set",
        {
            description:
                "Replace the full SVG markup. Must include ALL previous elements plus additions. Call svg_validate_and_screenshot when done.",
            inputSchema: {
                markup: z
                    .string()
                    .describe("Complete SVG markup with all elements"),
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
