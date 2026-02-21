import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServerContext } from "../mcp-server";

export function registerSvgListElements(
    server: McpServer,
    context: McpServerContext
) {
    server.tool(
        "svg_list_elements",
        "List all elements in the current SVG with their IDs, tag names, and key attributes.",
        {},
        async () => {
            const elements = context.svgDocument.listElements();
            if (elements.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "No elements found. The SVG is empty or not yet created.",
                        },
                    ],
                };
            }

            const lines = elements.map((el) => {
                const attrs = Object.entries(el.attributes)
                    .filter(([k]) => k !== "id")
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(" ");
                return `<${el.tag} id="${el.id}"${attrs ? " " + attrs : ""}>`;
            });

            return {
                content: [
                    {
                        type: "text",
                        text: `${elements.length} element(s):\n${lines.join("\n")}`,
                    },
                ],
            };
        }
    );
}
