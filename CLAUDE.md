# mcpsvg — AI-Powered SVG Editor VSCode Extension

## What This Is
A VSCode extension that exposes an MCP server for AI-powered SVG creation and editing.
AI clients connect via MCP and use the tools to create, modify, and export SVG files
that are displayed in a live VSCode editor panel with a Fabric.js canvas.

## Project Structure
- `src/tools/` — 13 MCP tool implementations (svg_create, svg_set, svg_get, etc.)
- `src/prompts/` — 5 MCP design prompts (logo, icon, badge, banner, graphic) + shared design philosophy
- `src/resources/` — MCP resource (svg-design-guidelines)
- `src/extension.ts` — VSCode extension entry point
- `src/mcp-server.ts` — Express SSE server for MCP connections
- `src/mcp-stdio.ts` — stdio transport for Claude Code
- `src/webview/` — Fabric.js canvas editor (main.ts, toolbar.ts, properties.ts)

## Build
```
npm run build    # one-time build
npm run watch    # watch mode during development
```

## Design Quality Standards
SVG outputs should NOT be generic. The prompts enforce:
- Mandatory design thinking phase before tool calls
- Explicit rejection of overused AI aesthetics (navy+gold, Inter, globes, swooshes)
- Use of SVG's native capabilities (filters, patterns, gradients) beyond basic fills
- Distinctive typography choices over invisible defaults

The shared design philosophy lives in `src/prompts/shared-design-philosophy.ts`.
The guidelines resource in `src/resources/svg-guidelines.ts` includes aesthetic standards.

## Code Conventions
- TypeScript strict mode
- Each tool/prompt/resource in its own file, registered via index.ts
- Zod schemas for all MCP tool and prompt arguments
- Prompt messages return `{ role: "user", content: { type: "text", text: "..." } }`
