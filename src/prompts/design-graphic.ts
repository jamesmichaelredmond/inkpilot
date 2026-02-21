import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCreativeNudge } from "./shared-design-philosophy";

export function registerDesignGraphicPrompt(server: McpServer) {
    server.registerPrompt(
        "design-graphic",
        {
            title: "Design Graphic",
            description:
                "Generate a distinctive SVG graphic — logos, icons, badges, banners, illustrations, or any custom design",
            argsSchema: {
                description: z
                    .string()
                    .describe(
                        "What to design (e.g., 'a logo for a coffee shop called Ember', 'a hexagonal badge for a hackathon', 'a hero banner for a SaaS product')"
                    ),
                style: z
                    .string()
                    .optional()
                    .describe(
                        "Aesthetic direction (e.g., 'brutal modernism', 'elegant editorial', 'retro techno', 'organic craft')"
                    ),
                colors: z
                    .string()
                    .optional()
                    .describe(
                        "Color preference or mood (e.g., 'deep violet + burnt orange', 'earth tones', specific hex codes)"
                    ),
            },
        },
        async ({ description, style, colors }) => {
            const styleCtx = style
                ? `\nRequested aesthetic: ${style}`
                : "";
            const colorCtx = colors
                ? `\nColor preference: ${colors}`
                : "";

            return {
                description: `Design a distinctive SVG graphic: ${description}`,
                messages: [
                    {
                        role: "user" as const,
                        content: {
                            type: "text" as const,
                            text: `Design a distinctive SVG graphic.

Request: ${description}${styleCtx}${colorCtx}

${getCreativeNudge()}

## Step 1: Classify and Size

Determine what you're making:
- **Logo/brand mark** → viewBox="0 0 400 400"
- **Icon/glyph** → viewBox="0 0 24 24" (width="240" height="240")
- **Badge/seal** → viewBox="0 0 400 400"
- **Banner/header** → viewBox="0 0 1200 400" (or 1200x630 for social)
- **Illustration** → viewBox sized to content

## Step 2: Reference Examples

Study these SVGs for structural quality. Do NOT copy them — adapt the technique level to your design:

**Logo pattern** — geometric mark + wordmark:
\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="mark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e85d04" />
      <stop offset="100%" stop-color="#dc2f02" />
    </linearGradient>
  </defs>
  <g id="background">
    <rect id="bg" width="400" height="400" fill="#fefae0" />
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

**Badge pattern** — layered rings + centered text:
\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="face-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1b4332" />
      <stop offset="100%" stop-color="#081c15" />
    </linearGradient>
  </defs>
  <g id="background"><rect id="bg" width="400" height="400" fill="#f5f5f0" /></g>
  <g id="badge">
    <circle id="outer-ring" cx="200" cy="200" r="175" fill="none" stroke="#b08968" stroke-width="6" />
    <circle id="inner-ring" cx="200" cy="200" r="162" fill="none" stroke="#b08968" stroke-width="1.5" stroke-dasharray="4 6" />
    <circle id="badge-face" cx="200" cy="200" r="155" fill="url(#face-grad)" />
  </g>
  <g id="text-content">
    <text id="title" x="200" y="190" text-anchor="middle" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="700"
          fill="#f5f5f0" letter-spacing="4">CERTIFIED</text>
    <line id="divider" x1="140" y1="212" x2="260" y2="212" stroke="#b08968" stroke-width="1.5" />
    <text id="subtitle" x="200" y="235" text-anchor="middle" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="14" fill="#b08968" letter-spacing="3">EXCELLENCE</text>
  </g>
</svg>
\`\`\`

Key patterns across both: proper <defs> usage, meaningful IDs on every element, grouped layers (background → shapes → text), dominant-baseline="central" on ALL text, gradients for depth, letter-spacing on uppercase.

## Step 3: Build Process

1. **svg_create**: Foundation — viewBox, <defs> with gradients/filters, background, and main structural shapes. Build substantially — not just a skeleton.

2. **svg_set**: Complete design — all remaining shapes, ALL text elements, details and refinements. This should be the finished graphic.
   - ALL text: text-anchor="middle" + dominant-baseline="central" + font-family with fallbacks
   - Calculate text positions mathematically from shape geometry
   - Text inside shapes: x = shape center x, y = shape center y

3. **svg_validate_and_screenshot**: Review the result. Fix any issues and screenshot again if needed.

## SVG Techniques Worth Using
- **Gradients**: linearGradient/radialGradient in <defs> — use contrasting tones, not just lighter/darker of the same hue
- **Texture**: <feTurbulence> + <feColorMatrix> for grain, <pattern> for repeating motifs, layered semi-transparent shapes
- **Depth**: overlapping shapes at 10-30% opacity, subtle <feGaussianBlur> under a shape for glow
- **Typography**: letter-spacing on uppercase, font-style="italic" on serifs for movement, font-variant="small-caps" for hierarchy
- **Geometry**: <clipPath> for reveals, transform="rotate(N)" to break rigidity, stroke-dasharray for decorative borders

Do NOT automatically save or export the file. After presenting the design, let the user know they can:
- Request adjustments (colors, typography, layout, details)
- Explore alternative directions (different aesthetic, colors, or approach)
- Save the project (svg_save_project) or export as .svg (svg_export) when they're happy with it`,
                        },
                    },
                ],
            };
        }
    );
}
