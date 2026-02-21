import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCreativeNudge } from "./shared-design-philosophy";

export function registerDesignBadgePrompt(server: McpServer) {
    server.registerPrompt(
        "design-badge",
        {
            title: "Design Badge",
            description: "Generate a professional SVG badge, seal, or emblem",
            argsSchema: {
                title: z
                    .string()
                    .describe(
                        "Main text on the badge (e.g., 'Certified', 'Best of 2025', 'Premium Member')"
                    ),
                subtitle: z
                    .string()
                    .optional()
                    .describe(
                        "Secondary text (e.g., organization name, category, year)"
                    ),
                shape: z
                    .string()
                    .optional()
                    .describe(
                        "Badge shape: circle (default), shield, ribbon, or hexagon"
                    ),
                colors: z
                    .string()
                    .optional()
                    .describe(
                        "Color scheme (e.g., 'gold and navy', 'red and white', specific hex codes)"
                    ),
                description: z
                    .string()
                    .optional()
                    .describe(
                        "Additional context about the badge purpose or visual elements to include"
                    ),
            },
        },
        async ({ title, subtitle, shape, colors, description }) => {
            const shapeChoice = shape || "circle";
            const subtitleCtx = subtitle
                ? `\nSubtitle text: "${subtitle}"`
                : "";
            const colorCtx = colors ? `\nColor preference: ${colors}` : "";
            const descCtx = description
                ? `\nAdditional context: ${description}`
                : "";

            const shapeGuide =
                shapeChoice === "shield"
                    ? `Shield/crest shape — rounded top that narrows to a point at bottom. Construct with a <path>. Fill most of the canvas with 15% padding.`
                    : shapeChoice === "ribbon"
                      ? `Ribbon/banner style — horizontal band with folded ends, layered over circular or rectangular backing. Title text sits on the ribbon.`
                      : shapeChoice === "hexagon"
                        ? `Hexagonal shape via <polygon points="...">. Flat-top for precision, pointy-top for innovation. Fill most of the canvas.`
                        : `Concentric circles — outer ring (border/accent) at r="175", inner face at r="155" for a 400x400 canvas. Classic seal/stamp format.`;

            return {
                description: `Design a ${shapeChoice} badge with title "${title}"`,
                messages: [
                    {
                        role: "user" as const,
                        content: {
                            type: "text" as const,
                            text: `Design a professional SVG badge/seal/emblem.

Title: "${title}"${subtitleCtx}
Shape: ${shapeChoice}${colorCtx}${descCtx}

${getCreativeNudge()}

## Reference Example

Study this badge SVG. Match its layered construction, text centering, and color depth:

\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="face-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1b4332" />
      <stop offset="100%" stop-color="#081c15" />
    </linearGradient>
  </defs>
  <g id="background">
    <rect id="bg" width="400" height="400" fill="#f5f5f0" />
  </g>
  <g id="badge">
    <circle id="outer-ring" cx="200" cy="200" r="175" fill="none" stroke="#b08968" stroke-width="6" />
    <circle id="inner-ring" cx="200" cy="200" r="162" fill="none" stroke="#b08968" stroke-width="1.5" stroke-dasharray="4 6" />
    <circle id="badge-face" cx="200" cy="200" r="155" fill="url(#face-grad)" />
    <circle id="highlight-ring" cx="200" cy="200" r="140" fill="none" stroke="#b08968" stroke-width="0.5" opacity="0.4" />
  </g>
  <g id="text-content">
    <text id="title" x="200" y="185" text-anchor="middle" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="32" font-weight="700"
          fill="#f5f5f0" letter-spacing="4">CERTIFIED</text>
    <line id="divider" x1="140" y1="210" x2="260" y2="210" stroke="#b08968" stroke-width="1.5" />
    <text id="subtitle" x="200" y="235" text-anchor="middle" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="14" font-weight="400"
          fill="#b08968" letter-spacing="3">EXCELLENCE</text>
  </g>
</svg>
\`\`\`

Notice: layered rings create depth (outer solid, inner dashed, face gradient, highlight ring), warm copper accent against deep forest green, Georgia serif with generous letter-spacing, divider line between title and subtitle, dominant-baseline="central" on ALL text.

## Shape Construction
${shapeGuide}

## Build Process

1. **svg_create**: Set up 400x400 canvas with <defs> (gradients), background, and the badge shape — outer ring, inner face, any decorative border elements. Build substantially in this first call.

2. **svg_set**: Complete the design — add all text (title centered, subtitle below), decorative details (max 2-3), and refinements. Remember:
   - ALL text needs text-anchor="middle" + dominant-baseline="central" + font-family with fallbacks
   - Title: bold (700), 24-32px, with letter-spacing="3" or "4" for uppercase
   - Subtitle: regular (400), 12-16px, ~40px below title
   - For curved text on circular badges: use <textPath> on an arc <path> in <defs>
   - Maximum 2-3 decorative elements — restraint reads as premium

3. **svg_validate_and_screenshot**: Review. Is text readable against the badge face? Do colors feel premium? Is there clear title/subtitle hierarchy?

Do NOT automatically save or export the file. After presenting the design, let the user know they can:
- Request adjustments (colors, text, decorative elements, sizing)
- Explore alternative shapes, color palettes, or decorative styles
- Save the project (svg_save_project) or export as .svg (svg_export) when they're happy with it`,
                        },
                    },
                ],
            };
        }
    );
}
