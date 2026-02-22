# Changelog

All notable changes to inkpilot are documented here.

## [1.0.1] - 2026-02-22

### Fixed
- Updated changelog to reflect 1.0.0 release (was showing "Unreleased")

## [1.0.0] - 2026-02-22

### Added
- Trackpad navigation: two-finger scroll to pan, pinch-to-zoom
- File icon for `.inkp` files in the VS Code explorer (light/dark variants)
- Save As button in the floating toolbar
- MUI Material icons for toolbar buttons (Save, Save As, Export)
- Marketplace metadata: keywords, gallery banner, categories

### Changed
- First stable release published to the VS Code Marketplace
- Toolbar buttons enlarged from 32px to 36px for easier interaction
- Updated pan/zoom controls: scroll wheel now pans by default, Ctrl+scroll or pinch to zoom
- Optimized VSIX packaging: excluded dev files and node_modules (10.5 MB → 2.3 MB)

## [0.3.0]

### Added
- Native SVG preview rendering — replaces Fabric.js canvas for pixel-accurate display of textPath, filters, masks, patterns, and gradients
- Claude Code auto-registration: MCP server registers/unregisters in `~/.claude.json` on activate/deactivate
- Artboard with auto light/dark detection based on SVG fill luminance
- Panel title updates to reflect the current project filename
- Curved text guidelines and textPath validation for circular badges/seals
- `svg_get_guidelines` tool for on-demand best practices
- Shared design philosophy module across all prompts
- General-purpose `design-graphic` prompt
- Reference SVG examples in all 5 design prompts

### Changed
- Webview bundle reduced from 800KB+ (Fabric.js) to ~8KB (native `<img>` rendering)
- Tool count optimized from 13 to 10 by consolidating overlapping tools, then expanded to 14 with dedicated single-purpose tools
- Design prompts streamlined: 2-3 build steps instead of 4-5, lightweight creative nudge instead of verbose thinking phase
- Tool descriptions trimmed to 2-3 sentences max

### Removed
- Fabric.js dependency and interactive editing (select, move, resize, rotate)
- Properties panel for element attributes
- `svg_create_from_template` tool — produced uniform-looking designs

## [0.1.0]

### Added
- MCP server with SSE transport on configurable port (default 7100)
- MCP stdio transport for Claude Code
- 8 SVG tools: create, set, get, add/update/remove element, list elements, screenshot
- CustomTextEditorProvider for `.inkp` files with dirty state, undo/redo, save
- Floating action bar with save/export buttons
- SVG validation tool checking 12 issue types
- Combined validate-and-screenshot tool
- MCP resource with SVG design guidelines (structure, typography, color)
- 5 design prompts: logo, icon, badge, banner, graphic
- Interactive Fabric.js canvas with select/move/resize/rotate
- Property panel for editing element attributes
- Bidirectional sync between AI and visual editor
- VS Code theme-aware webview styling
- Project save/open with `.inkp` JSON format
