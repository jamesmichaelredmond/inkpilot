import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const SVG_GUIDELINES_URI = "mcpsvg://guidelines/svg-design";

const SVG_DESIGN_GUIDELINES = `# SVG Design Guidelines for mcpsvg

## 1. SVG Structure

### Root Element
- ALWAYS include \`xmlns="http://www.w3.org/2000/svg"\` on the \`<svg>\` element
- ALWAYS set \`viewBox\` matching your design dimensions (e.g., \`viewBox="0 0 400 400"\`)
- Set explicit \`width\` and \`height\` attributes matching viewBox
- For logos/icons: use square viewBox (e.g., \`0 0 400 400\` for logos, \`0 0 24 24\` for icons)
- For banners: use wide viewBox (e.g., \`0 0 1200 400\`)

### Document Organization
\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <!-- Gradients, filters, clip paths, patterns -->
  </defs>
  <g id="background">
    <!-- Background shapes -->
  </g>
  <g id="main-content">
    <!-- Primary visual elements -->
  </g>
  <g id="text-content">
    <!-- Text elements last (rendered on top) -->
  </g>
</svg>
\`\`\`

## 2. Using \`<defs>\` for Reusable Definitions

Place ALL gradients, filters, clip paths, and patterns inside a \`<defs>\` block:

### Linear Gradients
\`\`\`xml
<defs>
  <linearGradient id="grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#6366f1" />
    <stop offset="100%" stop-color="#8b5cf6" />
  </linearGradient>
</defs>
<rect fill="url(#grad-primary)" ... />
\`\`\`

### Drop Shadows
\`\`\`xml
<defs>
  <filter id="shadow-sm" x="-10%" y="-10%" width="130%" height="130%">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.15" />
  </filter>
</defs>
\`\`\`

### Clip Paths
\`\`\`xml
<defs>
  <clipPath id="circle-clip">
    <circle cx="200" cy="200" r="150" />
  </clipPath>
</defs>
<g clip-path="url(#circle-clip)">...</g>
\`\`\`

## 3. Grouping and IDs

- Use \`<g>\` elements to group related shapes
- Give ALL groups and visual elements meaningful \`id\` attributes
- Nest logically: background > mid-ground > foreground > text
- Use \`transform\` on groups for positioning clusters

\`\`\`xml
<g id="icon-group" transform="translate(200, 200)">
  <circle id="icon-bg" cx="0" cy="0" r="60" fill="#6366f1" />
  <path id="icon-symbol" d="..." fill="white" />
</g>
\`\`\`

## 4. Typography

- ALWAYS specify \`font-family\` with a web-safe fallback stack:
  - Sans-serif: \`font-family="Inter, Helvetica, Arial, sans-serif"\`
  - Serif: \`font-family="Georgia, 'Times New Roman', serif"\`
  - Monospace: \`font-family="'SF Mono', 'Fira Code', monospace"\`
- Use \`text-anchor="middle"\` with x at center for centered text
- Use \`dominant-baseline="central"\` for vertical centering
- Keep text sizes proportional to viewBox (for 400x400: headings 28-40px, body 16-20px, captions 12-14px)
- Use \`letter-spacing\` for uppercase text (e.g., \`letter-spacing="2"\`)

\`\`\`xml
<text x="200" y="350"
      text-anchor="middle"
      dominant-baseline="central"
      font-family="Inter, Helvetica, Arial, sans-serif"
      font-size="32"
      font-weight="700"
      fill="#1e293b">
  Brand Name
</text>
\`\`\`

## 5. Color Best Practices

### Contrast and Readability
- Minimum 4.5:1 contrast ratio for text
- Dark text (#1e293b, #0f172a) on light backgrounds
- Light text (#f8fafc, #ffffff) on dark backgrounds

### Professional Color Palettes
- **Monochromatic**: Vary lightness of one hue (e.g., #dbeafe, #93c5fd, #3b82f6, #1d4ed8)
- **Complementary**: Two opposite hues (blue #3b82f6 + orange #f97316)
- **Analogous**: Adjacent hues (blue #3b82f6, indigo #6366f1, purple #8b5cf6)
- Limit palette to 3-5 colors maximum

### Avoid
- Pure black (#000000) — use near-black (#0f172a, #1e293b) instead
- Neon/oversaturated colors as large fills
- More than 2 gradients per design — use flat colors as the default, gradients sparingly for emphasis only

## 6. Logo Design Principles

- **Simplicity**: 3-7 shapes maximum for the main symbol
- **Scalability**: Must look clear at 32x32 pixels — avoid fine details
- **Balance**: Center the visual weight using \`transform="translate(cx, cy)"\`
- **Whitespace**: Leave 10-15% padding inside the viewBox edges
- **Symbol + Wordmark**: Place symbol above or left of text, with consistent spacing

### Logo Structure
\`\`\`xml
<svg viewBox="0 0 400 400" ...>
  <defs><!-- gradients, shadows if needed --></defs>
  <g id="logo" transform="translate(200, 160)">
    <g id="symbol">
      <!-- 2-5 geometric shapes, centered at 0,0 -->
    </g>
  </g>
  <text id="wordmark" x="200" y="300" text-anchor="middle" ...>Brand</text>
</svg>
\`\`\`

## 7. Icon Design Principles

- Use consistent stroke width (2px at 24x24 viewBox, scale proportionally)
- Align to pixel grid when possible
- Use \`stroke-linecap="round"\` and \`stroke-linejoin="round"\` for a friendly look
- For filled icons, use simple shapes with clear silhouettes
- Ensure the icon is recognizable at 16x16

## 8. Common SVG Patterns

### Rounded Rectangles
\`\`\`xml
<rect x="50" y="50" width="300" height="200" rx="16" fill="#f1f5f9" />
\`\`\`

### Circles with Borders
\`\`\`xml
<circle cx="200" cy="200" r="80" fill="#eff6ff" stroke="#3b82f6" stroke-width="3" />
\`\`\`

### Pill Shapes
\`\`\`xml
<rect x="100" y="180" width="200" height="40" rx="20" fill="#6366f1" />
\`\`\`

### Decorative Lines
\`\`\`xml
<line x1="100" y1="280" x2="300" y2="280" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round" />
\`\`\`

## 9. Quality Checklist

Before finalizing any SVG, verify:
1. viewBox is set and matches the design canvas
2. xmlns is present on the root \`<svg>\`
3. All text has \`font-family\` with fallback fonts
4. Color contrast is sufficient for readability
5. Elements are within the viewBox bounds
6. No accidental overlapping elements at identical positions
7. Gradients/filters are in \`<defs>\`, not inline
8. Groups have meaningful IDs
9. Design has appropriate whitespace/padding from edges
10. Take a screenshot with \`svg_screenshot\` and review the result visually

## 10. Recommended Workflow

1. Start with \`svg_create\` — set up root \`<svg>\` with correct viewBox, \`<defs>\`, and background
2. Use \`svg_set\` to progressively build: main shapes, then details, then text
3. Call \`svg_screenshot\` to visually inspect the result
4. Use \`svg_validate\` to check for structural issues
5. Iterate: fix any problems found, re-screenshot, confirm quality
6. Export when satisfied
`;

export function registerSvgGuidelines(server: McpServer) {
    server.resource(
        "svg-design-guidelines",
        SVG_GUIDELINES_URI,
        {
            description:
                "SVG design best practices and quality guidelines for creating professional SVG graphics",
        },
        async (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    mimeType: "text/markdown",
                    text: SVG_DESIGN_GUIDELINES,
                },
            ],
        })
    );
}
