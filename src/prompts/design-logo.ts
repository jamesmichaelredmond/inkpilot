import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCreativeNudge } from "./shared-design-philosophy";

export function registerDesignLogoPrompt(server: McpServer) {
    server.registerPrompt(
        "design-logo",
        {
            title: "Design Logo",
            description:
                "Generate a professional SVG logo with guided design direction",
            argsSchema: {
                company_name: z.string().describe("Company or brand name"),
                industry: z
                    .string()
                    .optional()
                    .describe(
                        "Industry or sector (e.g., tech, wellness, finance, food)"
                    ),
                style: z
                    .string()
                    .optional()
                    .describe(
                        "Design style: minimalist, geometric, organic, neo-brutalist, retro, or let the AI choose"
                    ),
                colors: z
                    .string()
                    .optional()
                    .describe(
                        "Color preference (e.g., 'blue and white', 'earth tones', 'vibrant', or specific hex codes)"
                    ),
                description: z
                    .string()
                    .optional()
                    .describe(
                        "Additional context about the brand, what it does, or specific visual ideas"
                    ),
            },
        },
        async ({ company_name, industry, style, colors, description }) => {
            const industryCtx = industry ? `\nIndustry: ${industry}` : "";
            const styleCtx = style ? `\nRequested style: ${style}` : "";
            const colorCtx = colors ? `\nColor preference: ${colors}` : "";
            const descCtx = description
                ? `\nAdditional context: ${description}`
                : "";

            return {
                description: `Design a professional logo for "${company_name}"`,
                messages: [
                    {
                        role: "user" as const,
                        content: {
                            type: "text" as const,
                            text: `Design a professional SVG logo for "${company_name}".${industryCtx}${styleCtx}${colorCtx}${descCtx}

${getCreativeNudge()}

## Reference Example

Study this complete logo SVG. Match its structural quality — proper defs, grouping, transforms, text centering, and technique level. Do NOT copy it; use it as a quality benchmark:

\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="mark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e85d04" />
      <stop offset="100%" stop-color="#dc2f02" />
    </linearGradient>
  </defs>
  <g id="background">
    <rect id="bg" width="400" height="400" fill="#fefae0" rx="0" />
  </g>
  <g id="symbol" transform="translate(200, 150)">
    <rect id="mark-square" x="-52" y="-52" width="104" height="104" rx="20" fill="url(#mark-grad)" transform="rotate(45)" />
    <circle id="mark-dot" cx="0" cy="0" r="20" fill="#fefae0" />
  </g>
  <g id="wordmark">
    <text id="brand-name" x="200" y="280" text-anchor="middle" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="700"
          fill="#370617" letter-spacing="3">MERIDIAN</text>
    <text id="tagline" x="200" y="320" text-anchor="middle" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="14" font-weight="400"
          fill="#6c584c" letter-spacing="5">DESIGN STUDIO</text>
  </g>
</svg>
\`\`\`

Notice: rotated rounded-rect as a distinctive mark, gradient with contrasting warm tones, Georgia serif for editorial authority, generous letter-spacing on uppercase, proper dominant-baseline="central" on all text, clean group structure, symbol centered via transform.

## Build Process

1. **svg_create**: Set up the full SVG with viewBox="0 0 400 400", <defs> (gradients if needed), background, and the symbol/mark shapes. Include the main geometric elements in this first call — don't leave it as just an empty skeleton.

2. **svg_set**: Complete the design — add the wordmark text, tagline, any remaining details or refinements. This call should produce the finished logo. Remember:
   - ALL text needs text-anchor="middle" + dominant-baseline="central" + font-family with fallbacks
   - Calculate text positions from shape geometry — don't eyeball
   - Keep 10-15% padding from viewBox edges (nothing within 40px of edges)
   - Maximum 1 typeface, 2-3 colors

3. **svg_validate_and_screenshot**: Review the result. Check silhouette clarity, text readability, color contrast (4.5:1 minimum), and visual balance. Fix issues if any.

Do NOT automatically save or export the file. After presenting the design, let the user know they can:
- Request adjustments (colors, typography, layout, sizing)
- Explore alternative directions (different symbol, palette, or typographic style)
- Save the project (svg_save_project) or export as .svg (svg_export) when they're happy with it`,
                        },
                    },
                ],
            };
        }
    );
}
