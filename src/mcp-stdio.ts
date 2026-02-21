/**
 * Standalone stdio MCP server for mcpsvg.
 * Launched by Claude Code (via mcpServerDefinitionProviders) or any stdio MCP client.
 * Syncs SVG state to the extension's webview via HTTP IPC on the configured port.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import http from "http";
import { SvgDocument } from "./svg-document";
import { registerAllTools } from "./tools";
import type { McpServerContext } from "./mcp-server";

const EXTENSION_PORT = parseInt(process.env.MCPSVG_PORT || "7100", 10);

/** Fire-and-forget POST to the extension's internal sync endpoint. */
function syncToExtension(svg: string, action?: string) {
    const body = JSON.stringify({ svg, action });
    const req = http.request(
        {
            hostname: "127.0.0.1",
            port: EXTENSION_PORT,
            path: "/internal/sync",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
            },
        },
        () => {} // ignore response
    );
    req.on("error", () => {}); // extension might not be running — that's fine
    req.write(body);
    req.end();
}

const svgDocument = new SvgDocument();

// Sync every SVG change to the extension webview
svgDocument.on("change", (svg: string) => {
    syncToExtension(svg);
});

const context: McpServerContext = {
    svgDocument,
    notifyWebview: () => {
        syncToExtension(svgDocument.getSvg());
    },
    openEditor: () => {
        syncToExtension("", "open");
    },
    requestScreenshot: async () => {
        // No direct webview access — fall back to resvg or SVG text
        return "";
    },
};

const server = new McpServer(
    { name: "mcpsvg", version: "0.1.0" },
    { capabilities: { tools: {} } }
);

registerAllTools(server, context);

const transport = new StdioServerTransport();
server.connect(transport);
