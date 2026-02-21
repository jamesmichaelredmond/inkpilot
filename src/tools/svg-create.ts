import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgCreate(
    server: McpServer,
    context: McpServerContext
) {
    server.registerTool(
        "svg_create",
        {
            description:
                "Create a new SVG and open the visual editor. Build substantially — include <defs>, background, and initial shapes. Use svg_set to refine, then svg_validate_and_screenshot to review. See svg_get_guidelines for text/typography rules.",
            inputSchema: {
                markup: z
                    .string()
                    .describe(
                        "Complete SVG markup with xmlns, viewBox, width, height, <defs>, and content groups"
                    ),
            },
        },
        async ({ markup }) => {
            context.openEditor();
            context.svgDocument.create(markup);
            context.notifyWebview();
            const count = context.svgDocument.listElements().length;
            return {
                content: [
                    {
                        type: "text",
                        text: `SVG created and displayed in editor. ${count} element(s). Use svg_set to progressively add more elements.`,
                    },
                ],
            };
        }
    );
}
