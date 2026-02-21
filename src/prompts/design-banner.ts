import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDesignBannerPrompt(server: McpServer) {
    server.registerPrompt(
        "design-banner",
        {
            title: "Design Banner",
            description:
                "Generate a professional SVG banner for headers, social media, or marketing",
            argsSchema: {
                heading: z
                    .string()
                    .describe("Main heading text for the banner"),
                subheading: z
                    .string()
                    .optional()
                    .describe("Supporting description or tagline"),
                purpose: z
                    .string()
                    .optional()
                    .describe(
                        "Banner purpose: website-hero, social-media, email-header, event, or announcement"
                    ),
                colors: z
                    .string()
                    .optional()
                    .describe(
                        "Color scheme or mood (e.g., 'dark and professional', 'bright and energetic', specific hex codes)"
                    ),
                description: z
                    .string()
                    .optional()
                    .describe(
                        "Additional context — brand name, visual elements to include, tone"
                    ),
            },
        },
        async ({ heading, subheading, purpose, colors, description }) => {
            const purposeChoice = purpose || "website-hero";
            const subCtx = subheading ? `\nSubheading: "${subheading}"` : "";
            const colorCtx = colors ? `\nColor preference: ${colors}` : "";
            const descCtx = description
                ? `\nAdditional context: ${description}`
                : "";

            const dimensionGuide =
                purposeChoice === "social-media"
                    ? `Use viewBox="0 0 1200 630" (Open Graph / social share ratio). Key content within center 1000x500 safe zone.`
                    : purposeChoice === "email-header"
                      ? `Use viewBox="0 0 600 200" (email-safe width, compact height). Keep text large — emails render at variable sizes.`
                      : purposeChoice === "event"
                        ? `Use viewBox="0 0 1200 600" (event banner, taller for impact). Center the event name prominently.`
                        : `Use viewBox="0 0 1200 400" (standard wide hero banner). Content weighted left or centered.`;

            return {
                description: `Design a ${purposeChoice} banner with heading "${heading}"`,
                messages: [
                    {
                        role: "user" as const,
                        content: {
                            type: "text" as const,
                            text: `Design a professional SVG banner.

Heading: "${heading}"${subCtx}
Purpose: ${purposeChoice}${colorCtx}${descCtx}

## Banner Design Rules

### Dimensions
${dimensionGuide}

### Layout Principles
- **Visual hierarchy**: Heading is the dominant element — largest, boldest, most prominent. Subheading supports but doesn't compete.
- **Content zones**: Divide the banner into zones — typically left 60% for text content, right 40% for visual elements (or fully centered text with decorative elements behind).
- **Breathing room**: Minimum 60-80px padding from all edges. Text should never touch or approach the banner boundary.
- **Alignment**: Left-align text for a modern editorial feel, or center-align for symmetrical/formal presentations. Don't mix alignments.

### Typography
- **Heading**: 40-56px, font-weight="700" or "800", use font-family="Inter, Helvetica, Arial, sans-serif"
- **Subheading**: 18-24px, font-weight="400", same font family, lighter color than heading for contrast hierarchy
- **Line spacing**: Position subheading 50-60px below heading baseline
- **Text anchor**: Use text-anchor="start" for left-aligned, text-anchor="middle" for centered
- **Vertical centering**: ALWAYS use dominant-baseline="central" on text elements — this centers text vertically on the y coordinate. Without it, text sits above its y position.
- **ALL text must have font-family with fallbacks**

### Buttons / Call-to-Action Elements
SVG has no native button — you build them from a rounded rect + centered text. Getting the text centered is critical:
\`\`\`
<rect x="X" y="Y" width="W" height="H" rx="8" fill="#color" />
<text x="X + W/2" y="Y + H/2" text-anchor="middle" dominant-baseline="central" font-family="Inter, Helvetica, Arial, sans-serif" font-size="16" font-weight="600" fill="#fff">Button Text</text>
\`\`\`
- The text x = rect x + rect width / 2 (horizontal center of the rect)
- The text y = rect y + rect height / 2 (vertical center of the rect)
- text-anchor="middle" centers horizontally, dominant-baseline="central" centers vertically
- Do NOT eyeball text position — always calculate from the rect's coordinates
- Button height should be 44-52px with 16-18px text for comfortable proportions
- Use rx="8" for subtle rounding or rx equal to half the height for a pill shape

### Background Techniques
1. **Solid color**: Simple, clean, professional. Use a single rich color (deep navy #0f172a, warm charcoal #1e293b, brand color).
2. **Subtle gradient**: Linear gradient at slight angle (x1="0%" y1="0%" x2="100%" y2="100%") with two close tones of the same hue. Avoid rainbow or multi-hue gradients.
3. **Geometric pattern**: Subtle shapes in the background at low opacity (5-15%) — circles, lines, dots, abstract geometric forms. They add texture without distracting from text.
4. **Split/accent**: A bold accent shape (angled rectangle, circle, wave) that occupies 30-40% of the banner, creating visual interest and a natural zone for secondary content.

### Color for Banners
- **Dark backgrounds** with light text are more impactful and modern for hero banners
- **Light backgrounds** work better for email headers and announcements
- Heading text: white (#ffffff) on dark, near-black (#0f172a) on light
- Subheading text: slightly muted version of heading color (e.g., #94a3b8 on dark, #64748b on light)
- Accent colors: Use sparingly — a single accent shape, underline, or highlight
- Maximum 3 colors total in the banner

### Decorative Elements
- **Abstract shapes**: Circles, rounded rectangles, or custom paths at low opacity behind or beside text
- **Accent lines**: Horizontal rules or decorative separators between heading and subheading
- **Geometric accents**: A bold shape (large circle, angled stripe) partially visible at the edge creates dynamism
- Keep decorations subordinate to text — they support, never compete

### Build Process
1. **svg_create**: Set up the canvas with correct dimensions, <defs> for gradients, background group
2. **svg_set**: Build the background — solid fill, gradient, or pattern. Add any large decorative shapes.
3. **svg_set**: Add heading and subheading text with proper font styling, positioning, and color
4. **svg_set**: Add accent elements — decorative shapes, lines, secondary visual elements
5. **svg_validate_and_screenshot**: Review. Check:
   - Is the heading immediately readable and dominant?
   - Is there clear hierarchy between heading and subheading?
   - Does the background support (not fight) the text?
   - Is there enough padding from edges?
   - Does the overall composition feel balanced (not lopsided)?
   - Are the colors cohesive?

### What NOT to do
- Don't make the subheading compete with the heading for attention
- Don't use more than 2 font sizes (heading + subheading)
- Don't add so many decorative elements that they distract from the message
- Don't use busy multi-color gradients (stick to 2 tones of one hue)
- Don't center-align text in a left-weighted composition (or vice versa)
- Don't forget that banners are often cropped — keep critical content in the center 80%`,
                        },
                    },
                ],
            };
        }
    );
}
