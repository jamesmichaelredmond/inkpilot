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
                    ? `Solid filled shapes with clear silhouettes. Use negative space (cutouts) for internal features, not strokes. Must be recognizable filled solid black.`
                    : styleChoice === "duotone"
                      ? `Two tonal values — primary color at full opacity for key features, same color at 20-30% opacity for secondary shapes. Creates depth without complexity.`
                      : `Stroke-based lines with stroke-width="2", stroke-linecap="round", stroke-linejoin="round". Use fill="none" on the icon group.`;

            return {
                description: `Design a ${styleChoice} icon representing "${concept}"`,
                messages: [
                    {
                        role: "user" as const,
                        content: {
                            type: "text" as const,
                            text: `Design a professional SVG icon representing "${concept}".

Style: ${styleChoice} | Context: ${sizeCtx} | Color: ${colorChoice}

## Reference Example

Study this icon SVG. Match its structural quality — consistent strokes, grid alignment, clean paths:

\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="240" height="240">
  <defs></defs>
  <g id="icon" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle id="compass-ring" cx="12" cy="12" r="10" />
    <polygon id="compass-needle" points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="#1e293b" stroke="none" />
  </g>
</svg>
\`\`\`

Notice: 24x24 viewBox with width/height="240" for editing, stroke properties set on the parent group, shapes aligned to the grid, minimal elements that communicate clearly.

## Style Direction
${styleGuide}

## Build Process

1. **svg_create**: Set up viewBox="0 0 24 24" width="240" height="240", empty <defs>, and the icon group with style defaults (stroke/fill properties on the parent <g>). Include the main shapes — build the icon substantially in this first call.

2. **svg_set**: Refine — adjust positions for optical centering, ensure stroke consistency, finalize the icon. The icon should be complete after this call.

3. **svg_validate_and_screenshot**: Review. Is the concept clear at a glance? Are strokes consistent? Is it optically centered? Would it read at 16px?

Key rules:
- viewBox="0 0 24 24", all content within 2-22 range (2px padding from edges)
- ONE stroke weight across the entire icon (2px standard at 24x24)
- Prefer simple shapes: <circle>, <rect>, <line>, <polyline> before <path>
- Don't mix stroke and fill styles in the same icon
- Don't use text elements in icons — they fail at small sizes
- Don't use gradients in UI icons — they break at small sizes

Do NOT automatically save or export the file. After presenting the design, let the user know they can:
- Request adjustments (stroke weight, style, proportions)
- Try alternative approaches (different metaphor, style, or level of detail)
- Save the project (svg_save_project) or export as .svg (svg_export) when they're happy with it`,
                        },
                    },
                ],
            };
        }
    );
}
