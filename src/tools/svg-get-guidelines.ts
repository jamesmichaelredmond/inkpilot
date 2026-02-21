import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SVG_DESIGN_GUIDELINES } from "../resources/svg-guidelines";

export function registerSvgGetGuidelines(server: McpServer) {
    server.registerTool(
        "svg_get_guidelines",
        {
            description:
                "Return SVG design best practices: text centering rules, defs usage, typography, color palettes, and quality standards. Call once at the start of a design task.",
        },
        async () => ({
            content: [{ type: "text" as const, text: SVG_DESIGN_GUIDELINES }],
        })
    );
}
