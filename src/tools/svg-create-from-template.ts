import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpServerContext } from "../mcp-server";

const TEMPLATES: Record<string, { description: string; svg: string }> = {
    logo: {
        description: "Logo: 400x400 square with symbol and wordmark areas",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs></defs>
  <g id="background"></g>
  <g id="symbol" transform="translate(200, 160)">
    <!-- Replace with logo symbol, centered at 0,0 -->
  </g>
  <g id="wordmark">
    <text id="brand-name" x="200" y="300" text-anchor="middle" dominant-baseline="central" font-family="Inter, Helvetica, Arial, sans-serif" font-size="36" font-weight="700" fill="#1e293b">Brand Name</text>
    <text id="tagline" x="200" y="340" text-anchor="middle" dominant-baseline="central" font-family="Inter, Helvetica, Arial, sans-serif" font-size="14" font-weight="400" fill="#64748b" letter-spacing="2">TAGLINE HERE</text>
  </g>
</svg>`,
    },
    icon: {
        description:
            "Icon: 24x24 viewBox (240x240 display) with stroke-based defaults",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="240" height="240">
  <defs></defs>
  <g id="icon" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- Replace with icon paths/shapes -->
  </g>
</svg>`,
    },
    badge: {
        description: "Badge: 400x400 with circular structure and text areas",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs></defs>
  <g id="background"></g>
  <g id="badge">
    <circle id="badge-ring" cx="200" cy="200" r="175" fill="none" stroke="#e2e8f0" stroke-width="3" />
    <circle id="badge-face" cx="200" cy="200" r="160" fill="#1e3a8a" />
    <text id="badge-title" x="200" y="180" text-anchor="middle" dominant-baseline="central" font-family="Inter, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">TITLE</text>
    <text id="badge-subtitle" x="200" y="220" text-anchor="middle" dominant-baseline="central" font-family="Inter, Helvetica, Arial, sans-serif" font-size="14" font-weight="400" fill="#bfdbfe" letter-spacing="1">SUBTITLE</text>
  </g>
</svg>`,
    },
    banner: {
        description:
            "Banner: 1200x400 wide format for headers and social media",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400">
  <defs></defs>
  <g id="background"></g>
  <g id="content">
    <g id="left-content" transform="translate(80, 200)">
      <text id="heading" x="0" y="-20" dominant-baseline="central" font-family="Inter, Helvetica, Arial, sans-serif" font-size="48" font-weight="700" fill="#1e293b">Heading Text</text>
      <text id="subheading" x="0" y="30" dominant-baseline="central" font-family="Inter, Helvetica, Arial, sans-serif" font-size="20" font-weight="400" fill="#64748b">Supporting description goes here</text>
    </g>
    <g id="right-content" transform="translate(900, 200)">
      <!-- Logo or visual element -->
    </g>
  </g>
</svg>`,
    },
};

const TEMPLATE_NAMES = Object.keys(TEMPLATES) as [string, ...string[]];

const TEMPLATE_LIST = TEMPLATE_NAMES.map(
    (k) => `- "${k}": ${TEMPLATES[k].description}`
).join("\n");

export function registerSvgCreateFromTemplate(
    server: McpServer,
    context: McpServerContext
) {
    server.tool(
        "svg_create_from_template",
        `Create a new SVG from a structural template with proper viewBox, defs, grouping, and typography already set up. Templates provide scaffolding only — no colors, gradients, or visual styling. You fill in all the visual design.

Available templates:
${TEMPLATE_LIST}

After creating from template, use svg_set to customize the content while preserving the structure.`,
        {
            template: z.enum(TEMPLATE_NAMES).describe("Template name to use"),
            name: z
                .string()
                .optional()
                .describe("Optional: replace the placeholder brand/title text"),
        },
        async ({ template, name }) => {
            let svg = TEMPLATES[template].svg;
            if (name) {
                svg = svg.replace("Brand Name", name);
                svg = svg.replace("TITLE", name);
                svg = svg.replace("Heading Text", name);
            }
            context.openEditor();
            context.svgDocument.create(svg);
            context.notifyWebview();
            const count = context.svgDocument.listElements().length;
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Created "${template}" template with ${count} element(s). Use svg_set to customize the content while keeping the structure.`,
                    },
                ],
            };
        }
    );
}
