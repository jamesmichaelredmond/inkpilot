import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDesignIconPrompt(server: McpServer) {
    server.registerPrompt(
        "design-icon",
        {
            title: "Design Icon",
            description:
                "Generate a professional SVG icon for UI, apps, or branding",
            argsSchema: {
                concept: z
                    .string()
                    .describe(
                        "What the icon represents (e.g., 'settings gear', 'user profile', 'lightning bolt', 'shopping cart')"
                    ),
                style: z
                    .string()
                    .optional()
                    .describe(
                        "Icon style: outline (stroke-based), filled (solid shapes), or duotone (two-tone fill)"
                    ),
                size_context: z
                    .string()
                    .optional()
                    .describe(
                        "Where the icon will be used: ui (16-24px), app-icon (512px+), logo-mark (standalone brand icon)"
                    ),
                color: z
                    .string()
                    .optional()
                    .describe(
                        "Icon color (default: near-black #1e293b for outline icons)"
                    ),
            },
        },
        async ({ concept, style, size_context, color }) => {
            const styleChoice = style || "outline";
            const sizeCtx = size_context || "ui";
            const colorChoice = color || "#1e293b";

            const styleGuide =
                styleChoice === "filled"
                    ? `Use solid filled shapes with clear silhouettes. The icon should be recognizable when filled solid black. Use negative space (cutouts) to define internal features rather than strokes.`
                    : styleChoice === "duotone"
                      ? `Use two tonal values — a primary color at full opacity for key features, and the same color at 20-30% opacity for secondary/background shapes. This creates depth without complexity.`
                      : `Use consistent stroke-based lines. Set stroke-width="2" (at 24x24 viewBox), stroke-linecap="round", stroke-linejoin="round" for a friendly, modern look. Use fill="none" on the icon group.`;

            const sizeGuide =
                sizeCtx === "app-icon"
                    ? `Design at 24x24 viewBox but with slightly more detail than a UI icon — this will be scaled up for app stores. Keep essential content within the center 80% (safe zone). Use bolder strokes (2.5-3px at 24x24) since app icons need to pop at a glance.`
                    : sizeCtx === "logo-mark"
                      ? `Design as a standalone brand mark at 24x24 viewBox. This must be unique and ownable — avoid generic/common icon shapes. It should have a distinctive silhouette that's recognizable even at 16px. Consider using a single custom shape rather than assembled standard icons.`
                      : `Design for UI use at 24x24 viewBox. Optimize for clarity at 16-24px display size. Align strokes to whole-pixel coordinates where possible to prevent blurring. Keep it simple — users spend fractions of a second reading UI icons.`;

            return {
                description: `Design a ${styleChoice} icon representing "${concept}"`,
                messages: [
                    {
                        role: "user" as const,
                        content: {
                            type: "text" as const,
                            text: `Design a professional SVG icon representing "${concept}".

Style: ${styleChoice}
Context: ${sizeCtx}
Color: ${colorChoice}

## Icon Design Rules

### Structure
- Use viewBox="0 0 24 24" (the standard icon grid)
- Set width="240" height="240" for comfortable editing (renders at 24x24 in production)
- Group all icon elements in <g id="icon">
- Include an empty <defs> section

### Style Direction
${styleGuide}

### Size Optimization
${sizeGuide}

### Construction Principles
1. **Grid alignment**: Design on the 24x24 grid. Place anchor points on whole numbers when possible (e.g., x="6" not x="6.3").
2. **Consistent stroke weight**: If using strokes, pick ONE weight and stick with it across the entire icon. Standard is 2px at 24x24.
3. **Optical balance**: Visually center the icon within the 24x24 frame. Mathematical center isn't always visual center — triangles and asymmetric shapes may need slight offset.
4. **2px padding**: Keep all content within the 2-22 range on both axes (2px padding from edges).
5. **Simplicity**: Use the minimum number of shapes to communicate the concept. Every element must earn its place.
6. **Silhouette test**: The icon filled solid black should still be recognizable.

### Build Process
1. **svg_create**: Set up the 24x24 viewBox with icon group and style defaults
2. **svg_set**: Build the icon using simple geometric shapes — prefer <circle>, <rect>, <line>, <polyline>, <path> in that order of simplicity
3. **svg_set**: Refine — adjust positions for optical centering, ensure stroke consistency
4. **svg_validate_and_screenshot**: Review the result. Check:
   - Is the concept immediately clear?
   - Are strokes/fills consistent?
   - Is it optically centered (not just mathematically)?
   - Would it be clear at 16px?
   - Does the silhouette read well?

### After presenting the design
Tell the user you can try alternative approaches — a different metaphor, style (outline vs filled vs duotone), or level of detail — if they'd like to see other options.

### What NOT to do
- Don't mix stroke-based and fill-based elements in the same icon (pick one style)
- Don't use text elements in icons (they won't render at small sizes)
- Don't add decorative details that disappear at 16px
- Don't use gradients in UI icons (they break at small sizes)
- Don't make strokes thinner than 1.5px at 24x24 — they'll disappear
- Don't use more than 2 colors (monochrome is standard for UI icons)`,
                        },
                    },
                ],
            };
        }
    );
}
