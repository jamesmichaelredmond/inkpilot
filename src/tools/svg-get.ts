import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServerContext } from "../mcp-server";

export function registerSvgGet(server: McpServer, context: McpServerContext) {
    server.registerTool(
        "svg_get",
        {
            description: "Return the current SVG source markup. Includes any visual edits made by the user in the editor. Useful for reviewing the current state before making modifications with svg_set.",
        },
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
