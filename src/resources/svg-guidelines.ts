import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const SVG_GUIDELINES_URI = "inkpilot://guidelines/svg-design";

export const SVG_DESIGN_GUIDELINES = `# SVG Design Guidelines for inkpilot

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
- **ALWAYS** use \`dominant-baseline="central"\` for vertical centering — without it, text sits above its y coordinate
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

### Centering Text Inside Shapes (Buttons, Badges, Labels)

SVG has no native button or label. Build them from a shape + centered text. Calculate positions — do NOT eyeball:

\`\`\`xml
<!-- Button: rect at (100, 180) size 200x48 -->
<rect x="100" y="180" width="200" height="48" rx="8" fill="#3b82f6" />
<text x="200" y="204" text-anchor="middle" dominant-baseline="central"
      font-family="Inter, Helvetica, Arial, sans-serif" font-size="16"
      font-weight="600" fill="#ffffff">Click Here</text>
<!-- x = 100 + 200/2 = 200 (center of rect) -->
<!-- y = 180 + 48/2 = 204 (center of rect) -->
\`\`\`

- **Horizontal center**: text x = rect x + (rect width / 2), then \`text-anchor="middle"\`
- **Vertical center**: text y = rect y + (rect height / 2), then \`dominant-baseline="central"\`
- For circles: text x = cx, text y = cy
- For pill buttons: use \`rx\` equal to half the rect height

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

## 9. Curved Text on Paths

For circular logos, badges, and seals, text often follows a curved path using \`<textPath>\`. Getting this right requires precise arc math.

### Top-of-Circle Text

Arc sweeps left-to-right across the top. Text reads normally.

\`\`\`xml
<defs>
  <!-- For a circle centered at (cx, cy), text at radius r -->
  <!-- Start: (cx - r, cy) → End: (cx + r, cy), sweep-flag=1 (clockwise over top) -->
  <path id="top-arc" d="M [cx-r],[cy] A [r],[r] 0 0,1 [cx+r],[cy]" fill="none" />
</defs>
<text>
  <textPath href="#top-arc" startOffset="50%" text-anchor="middle"
            font-family="Georgia, serif" font-size="14" fill="#333">
    TOP TEXT HERE
  </textPath>
</text>
\`\`\`

### Bottom-of-Circle Text (Right-Side Up)

**Critical**: the arc MUST sweep right-to-left so text reads left-to-right and is NOT upside down.

\`\`\`xml
<defs>
  <!-- Start: (cx + r, cy) → End: (cx - r, cy), sweep-flag=1 (clockwise under bottom) -->
  <path id="bottom-arc" d="M [cx+r],[cy] A [r],[r] 0 0,1 [cx-r],[cy]" fill="none" />
</defs>
<text>
  <textPath href="#bottom-arc" startOffset="50%" text-anchor="middle"
            font-family="Georgia, serif" font-size="14" fill="#333">
    BOTTOM TEXT HERE
  </textPath>
</text>
\`\`\`

### Concrete Example — Badge at (200, 200), Text Radius 100

\`\`\`xml
<defs>
  <path id="top-arc" d="M 100,200 A 100,100 0 0,1 300,200" fill="none" />
  <path id="bottom-arc" d="M 300,200 A 100,100 0 0,1 100,200" fill="none" />
</defs>

<text><textPath href="#top-arc" startOffset="50%" text-anchor="middle"
  font-family="Georgia, serif" font-size="14" letter-spacing="3"
  fill="#333">ESTABLISHED 2024</textPath></text>

<text><textPath href="#bottom-arc" startOffset="50%" text-anchor="middle"
  font-family="Georgia, serif" font-size="14" letter-spacing="3"
  fill="#333">PREMIUM QUALITY</textPath></text>
\`\`\`

### Key Rules

- **Text radius**: use a radius 15-25px larger than the visual circle the text follows
- **Letter-spacing**: 2-5px improves readability on curves (larger radius = less spacing needed)
- **Bottom text MUST use a reversed arc** (right-to-left start point) or it renders upside down
- **Always** put arc \`<path>\` elements inside \`<defs>\` — they are invisible guides
- Use \`fill="none"\` on the path; only add \`stroke\` for debugging
- **Always** use \`startOffset="50%"\` + \`text-anchor="middle"\` to center text on the arc
- For partial arcs (less than semicircle), calculate endpoints with: \`cx + r*cos(angle)\`, \`cy - r*sin(angle)\` (SVG y-axis is inverted)
- \`font-family\` with fallbacks is still required on the \`<textPath>\` or its parent \`<text>\`

## 10. Quality Checklist

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
10. Call \`svg_validate_and_screenshot\` and review the result visually

## 11. Recommended Workflow

1. Start with \`svg_create\` — set up root \`<svg>\` with correct viewBox, \`<defs>\`, and background
2. Use \`svg_set\` to progressively build: main shapes, then details, then text
3. Call \`svg_validate_and_screenshot\` to check structural quality and visually inspect
4. Iterate: fix any problems found, re-validate, confirm quality
5. Export when satisfied

## 12. Aesthetic Quality Standards

### Typography — System Fonts with Character
Prefer fonts that carry visual personality over invisible defaults:
- **Geometric/Modern**: Century Gothic, Trebuchet MS
- **Editorial/Authoritative**: Georgia, Palatino Linotype, Garamond
- **Raw/Mechanical**: Courier New, monospace
- **Impact statements**: Impact, 'Arial Black' (use sparingly, single words only)
- **Clarity at small sizes**: Verdana (digital-native, wide letterforms)
- **Avoid as first choice**: Inter, Helvetica, Arial, Roboto — not because they are bad,
  but because they are invisible. Use them only when deliberate neutrality IS the concept.

### Color Palettes to Avoid (Overused by AI)
These are statistically the most AI-generated color combinations — avoid unless brand-mandated:
- Navy #0f172a + gold/amber as the default "professional" palette
- Deep navy + teal #06b6d4
- Purple/indigo gradient (#6366f1 → #8b5cf6)
- Navy + gold, deep red + silver, forest green + cream as badge defaults
- Three-tone safe palettes applied so cautiously they read as monochrome

### SVG Texture and Depth Techniques
Use SVG's native capabilities before reaching for simple flat fills:
- **Noise/grain**: \`<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3"/>\`
  combined with \`<feColorMatrix>\` to extract alpha channel = grain overlay
- **Soft glow**: \`<feGaussianBlur>\` on a duplicate shape underneath the main shape
- **Light depth**: Multiple \`<radialGradient>\` circles at varying opacities (10-30%)
- **Pattern texture**: \`<pattern>\` with geometric micro-elements (dots, lines, crosses)
- **Angled gradients**: \`gradientTransform="rotate(37, 0.5, 0.5)"\` for unexpected depth

### Composition Principles
- Off-center focal points create more visual tension than perfectly centered compositions
- Overlap elements deliberately — a shape partially hidden by another creates depth
- Use the full canvas edge: elements that bleed off-edge feel intentional, not clipped
- Diagonal elements (\`transform="rotate(N)"\`) break horizontal/vertical rigidity
- Asymmetry is not imbalance — a large dark area can balance many small light elements
- Vary corner radii within a design — not every rectangle needs the same rx value

## 13. Common Aesthetic Failures

These patterns indicate generic AI output. If your design contains these, reconsider:

1. Navy or charcoal background as the default "safe" choice
2. Inter or Helvetica as the first typography instinct
3. A gradient from color X to a slightly lighter/darker color X
4. A perfectly centered, perfectly symmetrical composition with no visual tension
5. Clip-art concepts: globe, gear, rocket, lightbulb, shield, swoosh
6. Five-pointed stars as decorative accents
7. Drop shadows on every elevated element
8. Three horizontal color bands as a background
9. All corners the same radius (mix rx values or use sharp corners deliberately)
10. Concentric circles with "CERTIFIED" text as the only badge concept
`;

export function registerSvgGuidelines(server: McpServer) {
    server.registerResource(
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
