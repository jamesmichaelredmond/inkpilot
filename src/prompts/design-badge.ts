import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

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
                    ? `Use a shield/crest shape — a rounded rectangle that narrows to a point at the bottom. Construct with a <path> element. The shield should fill most of the canvas with 15% padding from edges.`
                    : shapeChoice === "ribbon"
                      ? `Create a ribbon/banner style badge — a horizontal band with folded ends at an angle, layered over a circular or rectangular backing. Use the ribbon as the primary text area with the main title.`
                      : shapeChoice === "hexagon"
                        ? `Use a hexagonal shape constructed with <polygon points="...">. A regular hexagon with flat top communicates engineering/precision; pointy top communicates innovation. Fill most of the canvas.`
                        : `Use concentric circles — an outer ring (border/accent), inner circle (main face), with text centered inside. The classic seal/stamp format. Outer ring at r="175", inner at r="155-160" for a 400x400 canvas.`;

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

## Badge Design Rules

### Structure
- Use viewBox="0 0 400 400" width="400" height="400"
- Include <defs> for any gradients or filters
- Group elements: <g id="background">, <g id="badge">, <g id="text-content">

### Shape Construction
${shapeGuide}

### Typography for Badges
- **Title text**: Bold (font-weight="700"), 24-32px, centered with text-anchor="middle"
- **Subtitle text**: Regular weight (400), 12-16px, positioned below title with ~40px gap
- **Curved text** (for circular badges): Use <textPath> on a <path> arc for text that follows the badge rim. Define the arc path in <defs>.
- **ALL text must have**: font-family="Inter, Helvetica, Arial, sans-serif" (with fallbacks)
- **Uppercase titles**: Add letter-spacing="2" or "3" for uppercase text — it needs room to breathe
- **Vertical centering**: ALWAYS use dominant-baseline="central" — without it, text renders ABOVE its y coordinate. This is the #1 cause of misaligned text in SVG.
- **Centering text in the badge face**: For a circle at cx="200" cy="200", place title at x="200" y="190" and subtitle at x="200" y="225". Both need text-anchor="middle" AND dominant-baseline="central".

### Color Strategy
- Badges work best with 2-3 colors: a dark primary (face), a metallic/light accent (border/highlights), and white/light text
- Classic combinations: navy + gold, deep red + silver, forest green + cream, charcoal + copper
- Use a subtle gradient on the badge face for depth (top-to-bottom, slightly lighter at top)
- Border/ring in a contrasting or complementary tone
- Text in white or very light color on dark backgrounds, dark on light

### Professional Badge Techniques
1. **Layered rings**: Multiple concentric circles with different stroke widths and colors create a premium seal feel
2. **Inner shadow**: A subtle inner ring 2-3px inside the main circle creates perceived depth
3. **Decorative elements**: Stars, laurel branches (symmetrical paths), dots along the rim — but keep it restrained
4. **Border texture**: A dashed or dotted stroke on the outer ring suggests a perforated/stamped edge

### Build Process
1. **svg_create**: Set up 400x400 canvas with defs and groups
2. **svg_set**: Build the badge shape — outer ring, inner face, any decorative border elements
3. **svg_set**: Add text — title centered, subtitle below, any curved rim text
4. **svg_set**: Add details — stars, accents, decorative elements (keep to 2-3 max)
5. **svg_validate_and_screenshot**: Review. Check:
   - Is the text readable against the badge face?
   - Is the badge shape clean and symmetrical?
   - Do the colors feel premium/authoritative?
   - Is there hierarchy between title and subtitle?
   - Does it look like an official seal, not a sticker?

### After presenting the design
Tell the user you can explore alternative directions — a different shape, color palette, or decorative style — if they'd like to see other options.

### What NOT to do
- Don't use more than 3 decorative elements (stars, dots, etc.) — restraint is premium
- Don't make text too small — it must be readable when the badge is displayed at 100px
- Don't use thin strokes for the badge border — 3-5px minimum for the outer ring
- Don't mix more than 3 colors
- Don't use drop shadows on badges (they look like web buttons from 2008)
- Don't forget to test color contrast between text and badge face`,
                        },
                    },
                ],
            };
        }
    );
}
