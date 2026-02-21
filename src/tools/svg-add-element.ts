import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgAddElement(
    server: McpServer,
    context: McpServerContext
) {
    server.tool(
        "svg_add_element",
        "Add a single SVG element (rect, circle, text, path, etc.) to the current document. Good for quick additions. For complex multi-element updates, prefer svg_set with the full markup.",
        {
            tag: z
                .string()
                .describe(
                    "SVG element tag name (e.g. rect, circle, path, text, g)"
                ),
            attributes: z
                .record(z.string())
                .describe(
                    'Element attributes as key-value pairs (e.g. {"cx":"50","cy":"50","r":"25","fill":"blue"})'
                ),
        },
        async ({ tag, attributes }) => {
            context.openEditor();
            const id = context.svgDocument.addElement(tag, attributes);
            context.notifyWebview();
            return {
                content: [
                    {
                        type: "text",
                        text: `Element <${tag}> added with id="${id}".`,
                    },
                ],
            };
        }
    );
}
