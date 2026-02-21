import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCreativeNudge } from "./shared-design-philosophy";

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
                    ? `viewBox="0 0 1200 630" (Open Graph ratio). Key content within center 1000x500.`
                    : purposeChoice === "email-header"
                      ? `viewBox="0 0 600 200" (email-safe width). Keep text large.`
                      : purposeChoice === "event"
                        ? `viewBox="0 0 1200 600" (taller for impact).`
                        : `viewBox="0 0 1200 400" (standard hero banner).`;

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
Dimensions: ${dimensionGuide}

${getCreativeNudge()}

## Reference Example

Study this banner SVG. Match its layout, typography hierarchy, and background treatment:

\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a2e" />
      <stop offset="100%" stop-color="#16213e" />
    </linearGradient>
  </defs>
  <g id="background">
    <rect id="bg" width="1200" height="400" fill="url(#bg-grad)" />
    <circle id="accent-orb" cx="950" cy="200" r="280" fill="#e94560" opacity="0.08" />
    <circle id="accent-orb-sm" cx="1050" cy="150" r="120" fill="#e94560" opacity="0.05" />
  </g>
  <g id="content">
    <text id="heading" x="100" y="165" text-anchor="start" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="700"
          fill="#f8f8f8">Launch Something Bold</text>
    <text id="subheading" x="100" y="230" text-anchor="start" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="20" font-weight="400"
          fill="#8a8a9a">The platform for teams that ship fast and think different.</text>
    <rect id="cta-btn" x="100" y="275" width="200" height="48" rx="8" fill="#e94560" />
    <text id="cta-text" x="200" y="299" text-anchor="middle" dominant-baseline="central"
          font-family="Trebuchet MS, Helvetica, sans-serif" font-size="16" font-weight="600"
          fill="#ffffff">Get Started</text>
  </g>
</svg>
\`\`\`

Notice: angled gradient background, subtle accent orbs at low opacity for depth, left-aligned editorial layout, clear heading/subheading hierarchy (size + color contrast), CTA button with mathematically centered text (text x = rect x + width/2, text y = rect y + height/2), dominant-baseline="central" on ALL text, 100px padding from left edge.

## Build Process

1. **svg_create**: Set up the canvas with correct dimensions, <defs> (background gradient), background shapes, and any large decorative elements (accent shapes, patterns). Build the foundation substantially.

2. **svg_set**: Complete the design — add heading, subheading, CTA button if appropriate, and any accent details. Remember:
   - ALL text needs dominant-baseline="central" + font-family with fallbacks
   - Heading: 40-56px, bold (700-800), dominant color
   - Subheading: 18-24px, regular (400), muted color for hierarchy
   - Button text centering: x = rect x + rect width/2, y = rect y + rect height/2
   - Minimum 60-80px padding from all edges
   - Maximum 3 colors total

3. **svg_validate_and_screenshot**: Review. Is the heading immediately dominant? Clear hierarchy? Background supports text without fighting it? Enough padding from edges?

Do NOT automatically save or export the file. After presenting the design, let the user know they can:
- Request adjustments (text, colors, layout, background treatment)
- Explore alternative layouts, color schemes, or background styles
- Save the project (svg_save_project) or export as .svg (svg_export) when they're happy with it`,
                        },
                    },
                ],
            };
        }
    );
}
