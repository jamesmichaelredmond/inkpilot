import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import type { McpServerContext } from "../mcp-server";

export function registerSvgExport(
    server: McpServer,
    context: McpServerContext
) {
    server.registerTool(
        "svg_export",
        {
            description: "Export the current SVG as a standalone .svg file for use in other projects.",
            inputSchema: {
                path: z
                    .string()
                    .describe(
                        "Absolute file path to write the .svg file (e.g. /home/user/assets/logo.svg)"
                    ),
            },
        },
        async ({ path: filePath }) => {
            const svg = context.svgDocument.getSvg();
            if (!svg) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: "No SVG content to export. Create or load an SVG first.",
                        },
                    ],
                    isError: true,
                };
            }

            // Ensure .svg extension
            let exportPath = filePath;
            if (!exportPath.endsWith(".svg")) {
                exportPath += ".svg";
            }

            // Ensure directory exists
            const dir = path.dirname(exportPath);
            fs.mkdirSync(dir, { recursive: true });

            // Write with XML declaration for maximum compatibility
            const output = `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`;
            fs.writeFileSync(exportPath, output, "utf-8");

            return {
                content: [
                    {
                        type: "text" as const,
                        text: `SVG exported to ${exportPath}`,
                    },
                ],
            };
        }
    );
}
