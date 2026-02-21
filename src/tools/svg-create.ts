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
            description: `Create a new SVG and open the visual editor.

Build substantially in this first call — include the SVG root, <defs> with any gradients/filters, background, AND initial structural shapes. Don't create an empty skeleton.

Structure example:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e85d04" />
      <stop offset="100%" stop-color="#dc2f02" />
    </linearGradient>
  </defs>
  <g id="background"><rect id="bg" width="400" height="400" fill="#fefae0" /></g>
  <g id="main-content"><!-- shapes here --></g>
</svg>

Then use svg_set to complete the design (add text, details, refinements). Aim for 1-2 svg_set calls total, then svg_validate_and_screenshot.

Key reminders:
- Give ALL visual elements meaningful id attributes
- Put gradients/filters/clipPaths inside <defs>
- Use transform="translate(cx,cy)" on groups to center content
- For text: ALWAYS use dominant-baseline="central" + text-anchor="middle" + font-family with fallbacks`,
            inputSchema: {
                markup: z
                    .string()
                    .describe(
                        "SVG markup string. Must include <svg> with xmlns, viewBox, width, height. Include a <defs> section and background group. Add more content via svg_set calls."
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
