import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgUpdateElement(
    server: McpServer,
    context: McpServerContext
) {
    server.tool(
        "svg_update_element",
        "Update an existing element by ID. Change any attributes (fill, stroke, position, size, font-family, etc.). Set an attribute to empty string to remove it. Use svg_list_elements to find element IDs.",
        {
            id: z
                .string()
                .describe(
                    "The element ID to update (use svg_list_elements to find IDs)"
                ),
            attributes: z
                .record(z.string())
                .describe(
                    'Attributes to set (e.g. {"fill":"red","opacity":"0.5"})'
                ),
        },
        async ({ id, attributes }) => {
            const success = context.svgDocument.updateElement(id, attributes);
            if (success) context.notifyWebview();
            if (!success) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Element with id="${id}" not found. Use svg_list_elements to see available elements.`,
                        },
                    ],
                    isError: true,
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `Element "${id}" updated: ${Object.entries(
                            attributes
                        )
                            .map(([k, v]) => `${k}="${v}"`)
                            .join(", ")}.`,
                    },
                ],
            };
        }
    );
}
