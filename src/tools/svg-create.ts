import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

export function registerSvgCreate(
    server: McpServer,
    context: McpServerContext
) {
    server.tool(
        "svg_create",
        `Create a new SVG and open the visual editor.

IMPORTANT: Read the svg-design-guidelines resource FIRST for quality best practices.

BUILD INCREMENTALLY: Start with the <svg> root element including xmlns, viewBox, width, and height. Include a <defs> section for any gradients/filters. Add a background group. Then use svg_set calls to progressively layer content.

Structure your initial SVG like this:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H" width="W" height="H">
  <defs><!-- gradients, filters, clip paths --></defs>
  <g id="background"><!-- background shapes --></g>
</svg>

Then call svg_set to add main shapes, then text, then details. Each call updates the live editor so the user watches the design come together step by step.

After building, call svg_validate_and_screenshot to check quality and visually verify the result.`,
        {
            markup: z
                .string()
                .describe(
                    "SVG markup string. Must include <svg> with xmlns, viewBox, width, height. Include a <defs> section and background group. Add more content via svg_set calls."
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
