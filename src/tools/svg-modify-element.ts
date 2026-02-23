import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgModifyElement(
    server: McpServer,
    context: McpServerContext
) {
    server.registerTool(
        "svg_modify_element",
        {
            description:
                "Add, update, or remove a single SVG element. For multi-element changes, prefer svg_set with full markup.",
            inputSchema: {
                action: z
                    .enum(["add", "update", "remove"])
                    .describe(
                        "add: insert new element, update: change attributes by ID, remove: delete by ID"
                    ),
                tag: z
                    .string()
                    .optional()
                    .describe("SVG tag name (required for add)"),
                id: z
                    .string()
                    .optional()
                    .describe("Element ID (required for update/remove)"),
                attributes: z
                    .record(z.string())
                    .optional()
                    .describe("Attributes to set (required for add/update)"),
            },
        },
        async ({ action, tag, id, attributes }) => {
            if (action === "add") {
                if (!tag) {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: 'Missing "tag" for add action.',
                            },
                        ],
                        isError: true,
                    };
                }
                context.openEditor();
                const newId = context.svgDocument.addElement(
                    tag,
                    attributes || {}
                );
                context.notifyWebview();
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Element <${tag}> added with id="${newId}".`,
                        },
                    ],
                };
            }

            if (action === "update") {
                if (!id) {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: 'Missing "id" for update action.',
                            },
                        ],
                        isError: true,
                    };
                }
                if (!attributes || Object.keys(attributes).length === 0) {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: 'Missing "attributes" for update action.',
                            },
                        ],
                        isError: true,
                    };
                }
                const success = context.svgDocument.updateElement(
                    id,
                    attributes
                );
                if (success) context.notifyWebview();
                if (!success) {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: `Element with id="${id}" not found.`,
                            },
                        ],
                        isError: true,
                    };
                }
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Element "${id}" updated: ${Object.entries(
                                attributes
                            )
                                .map(([k, v]) => `${k}="${v}"`)
                                .join(", ")}.`,
                        },
                    ],
                };
            }

            // action === "remove"
            if (!id) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: 'Missing "id" for remove action.',
                        },
                    ],
                    isError: true,
                };
            }
            const success = context.svgDocument.removeElement(id);
            if (success) context.notifyWebview();
            if (!success) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Element with id="${id}" not found.`,
                        },
                    ],
                    isError: true,
                };
            }
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Element "${id}" removed.`,
                    },
                ],
            };
        }
    );
}
