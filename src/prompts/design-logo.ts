import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

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

Follow this professional logo design process:

## Step 1: Concept (think before drawing)
Before writing any SVG, decide on:
- **Logo type**: Symbol + wordmark (icon above/left of text) or pure wordmark (typography only). Choose symbol+wordmark if the name is long or generic; pure wordmark if the name is short and distinctive.
- **Symbol concept**: If using a symbol, pick ONE clear concept — an abstract geometric mark, a letterform (first letter stylized), or a simple metaphor. Keep it to 3-5 shapes maximum. It must be recognizable as a silhouette at 32px.
- **Shape language**: Circles suggest community/harmony. Squares suggest stability/trust. Triangles suggest innovation/growth. Organic curves suggest approachability/nature. Choose shapes that match the brand personality.
- **Typography**: Use a geometric sans-serif (Inter, Helvetica, Arial) for tech/modern brands. Use a serif (Georgia, Times) for premium/editorial brands. Maximum 1 typeface. Use letter-spacing: wide (2-4) for uppercase premium feel, tight for tech efficiency.
- **Color palette**: Maximum 2-3 colors. Use the 60-30-10 rule (primary 60%, secondary 30%, accent 10%). Avoid pure black (#000) — use near-black (#0f172a or #1e293b). Avoid neon/oversaturated fills. Prefer flat colors as default; use gradients only with intent, sparingly, max 2-3 stops.

## Step 2: Build incrementally
1. **First svg_create call**: Set up the SVG structure:
   - viewBox="0 0 400 400", width="400", height="400"
   - Empty <defs> section (add gradients/filters here if needed later)
   - Background group <g id="background">
   - Symbol group <g id="symbol" transform="translate(200, 160)"> centered for the icon
   - Wordmark group <g id="wordmark"> for text elements

2. **Second svg_set call**: Build the symbol using geometric primitives:
   - Use <circle>, <rect>, <polygon>, <path> — prefer simple shapes over complex paths
   - Center the symbol at (0,0) within its translated group
   - Apply optical corrections: circles should be ~2-3% larger than squares to appear the same size
   - Keep the symbol within a ~120px radius from center

3. **Third svg_set call**: Add the wordmark:
   - Position below the symbol (y="300" area for 400x400 canvas)
   - ALWAYS include font-family with fallbacks: font-family="Inter, Helvetica, Arial, sans-serif"
   - Use text-anchor="middle" for horizontal centering and dominant-baseline="central" for vertical centering — BOTH are required. Without dominant-baseline="central", text renders above its y coordinate.
   - Size proportional to canvas: 28-40px for brand name, 12-16px for tagline
   - Apply letter-spacing for uppercase text
   - If placing text inside a shape (badge circle, button rect), calculate the center: text x = shape center x, text y = shape center y. Do NOT eyeball positions.

4. **Fourth svg_set call**: Refine and polish:
   - Add any gradients or subtle shadows to <defs> if they serve the design
   - Ensure 10-15% padding from viewBox edges (nothing within 40px of edges)
   - Balance visual weight between symbol and text
   - Verify color contrast: light text on dark, dark text on light, minimum 4.5:1 ratio

## Step 3: Validate and review
- Call svg_validate_and_screenshot to check both structure and visual result
- Review the screenshot critically:
  - Is the silhouette recognizable? Would it work at favicon size?
  - Is there visual balance between symbol and wordmark?
  - Does the color palette feel cohesive (not random)?
  - Is the text readable with proper contrast?
  - Is there breathing room (whitespace) around all elements?
- Fix any issues found, then screenshot again

## After presenting the design
Tell the user you can explore alternative directions — a different symbol concept, color palette, or typographic style — if they'd like to see other options.

## What NOT to do
- Don't use more than 2-3 colors
- Don't use more than 1 typeface
- Don't add fine details that disappear at small sizes
- Don't use heavy drop shadows, bevels, or 3D effects
- Don't place gradients on everything — flat color is the default, gradients are the exception
- Don't skip the screenshot review step
- Don't make the symbol overly complex (max 5-7 shapes)
- Don't use generic swooshes, globes, or clip-art-style imagery`,
                        },
                    },
                ],
            };
        }
    );
}
