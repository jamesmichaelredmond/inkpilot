import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgCreate(
    server: McpServer,
    context: McpServerContext
) {
    server.tool(
        "svg_create",
        `Create a new SVG and open the visual editor. BUILD INCREMENTALLY: Start with just the background/canvas elements, then call svg_set multiple times to progressively add content (main shapes, then text, then details). Each call updates the live editor so the user watches the design come together step by step.`,
        {
            markup: z
                .string()
                .describe(
                    "SVG markup string. Start minimal — just the <svg> root with background shapes. Add more via svg_set calls."
                ),
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
