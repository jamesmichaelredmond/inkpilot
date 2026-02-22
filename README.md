# inkpilot

**AI-powered SVG creation and editing, right inside VS Code.**

Tell your AI what to design. Watch it build — logos, icons, badges, banners — live in a visual editor. Iterate by conversation, not by hand.

<!-- TODO: Add a screenshot or GIF here showing the editor in action -->
<!-- ![inkpilot in action](images/demo.gif) -->

## How It Works

inkpilot is a VS Code extension that runs an [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) server. Any MCP-compatible AI client — Claude, Copilot Chat, or others — connects to the server and gets access to tools for creating and manipulating SVG graphics. Changes appear instantly in a live preview panel.

```
You: "Design a logo for a coffee shop called Brewed Awakening"
 AI: Creates SVG with geometric coffee cup mark, warm earth-tone palette,
     Georgia serif wordmark — displayed live in the editor
You: "Make the cup more abstract, try a terracotta color scheme"
 AI: Updates the design in-place, you see changes immediately
You: "Perfect. Export it."
 AI: Saves a clean .svg file to your project
```

## Features

### Live Visual Editor
- Real-time SVG preview as the AI builds your design
- Trackpad pan (two-finger scroll) and pinch-to-zoom, plus Space+drag, middle-mouse, and Alt+drag
- Native SVG rendering — what you see is what you export
- VS Code theme-aware interface

### 14 MCP Tools
The AI uses these tools to create and modify SVGs programmatically:

| Tool | Description |
|------|-------------|
| `svg_create` | Create a new SVG and open the visual editor |
| `svg_set` | Replace the entire SVG markup |
| `svg_get` | Read the current SVG source |
| `svg_add_element` | Add a single element to the document |
| `svg_update_element` | Update an existing element's attributes by ID |
| `svg_remove_element` | Remove an element by ID |
| `svg_modify_element` | Add, update, or remove a single element (combined) |
| `svg_list_elements` | Inspect all elements with their IDs and attributes |
| `svg_validate_and_screenshot` | Validate structure and/or render a PNG screenshot for AI review |
| `svg_screenshot` | Render the current SVG to a PNG for visual feedback |
| `svg_get_guidelines` | Retrieve SVG design best practices |
| `svg_save_project` | Save as a `.inkp` project file |
| `svg_open_project` | Load a saved project |
| `svg_export` | Export as a standalone `.svg` file |

### 5 Design Prompts
Pre-built prompts that guide the AI through a structured design process:

- **design-logo** — Professional logos with symbol + wordmark
- **design-icon** — Crisp icons optimized for small sizes
- **design-badge** — Seals, emblems, and certification badges
- **design-banner** — Wide-format headers and banners
- **design-graphic** — General-purpose SVG illustrations

Each prompt includes reference SVGs, build steps, and quality constraints so the AI produces well-structured, distinctive output — not generic clip art.

### Built-In Design Standards
The extension ships with comprehensive SVG design guidelines covering:
- Proper document structure (`<defs>`, grouping, IDs)
- Typography rules (font stacks, text centering, dominant-baseline)
- Color contrast and palette guidance
- Curved text on paths (for circular badges and seals)
- A quality checklist the AI follows before presenting results

### Project Files
Save your work as `.inkp` project files that preserve the full SVG state. Double-click to reopen in the editor and continue iterating with the AI.

## Getting Started

### 1. Install the extension
Search for **inkpilot** in the VS Code Extensions marketplace, or install from the command line:
```
code --install-extension Redmond-Enterprises-LLC.inkpilot
```

### 2. Connect an AI client

**VS Code Copilot Chat (built-in MCP support):**
The extension automatically registers as an MCP server provider. Enable it in Copilot Chat settings — no configuration needed.

**Claude Code (CLI):**
The extension auto-registers with Claude Code on activation. If you have Claude Code installed, it connects automatically.

**Other MCP clients (SSE):**
Point your client to:
```
http://localhost:7100/sse
```

### 3. Start designing
Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:
```
inkpilot: Open SVG Editor
```

Then ask your AI to design something. Use the design prompts for best results:
> Use the design-logo prompt to create a logo for "Skyline Architects"

Or just describe what you want:
> Create a minimalist SVG badge that says "Handcrafted" with an artisan feel

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `inkpilot: Open SVG Editor` | | Open the visual editor panel |
| `inkpilot: Start MCP Server` | | Manually start the MCP server |
| `inkpilot: Save Project` | `Ctrl+S` / `Cmd+S` | Save the current project |
| `inkpilot: Save Project As...` | `Ctrl+Shift+S` / `Cmd+Shift+S` | Save to a new location |
| `inkpilot: Open Project` | `Ctrl+O` / `Cmd+O` | Open a `.inkp` project file |
| `inkpilot: Export SVG` | `Ctrl+E` / `Cmd+E` | Export as a standalone `.svg` file |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `inkpilot.port` | `7100` | Port for the MCP SSE server |

## Requirements

- VS Code 1.109.0 or later
- An MCP-compatible AI client (Claude, Copilot Chat, or any MCP client)

## License

MIT
