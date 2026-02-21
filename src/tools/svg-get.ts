import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServerContext } from "../mcp-server";

export function registerSvgGet(server: McpServer, context: McpServerContext) {
    server.tool(
        "svg_get",
        "Return the current SVG source. Includes any visual edits made by the user in the editor.",
        {},
        async () => {
            const svg = context.svgDocument.getSvg();
            if (!svg) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "No SVG is currently loaded. Use svg_create first.",
                        },
                    ],
                    isError: true,
                };
            }
            return {
                content: [{ type: "text", text: svg }],
            };
        }
    );
}
