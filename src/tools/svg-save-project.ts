import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import type { McpServerContext } from "../mcp-server";

export function registerSvgSaveProject(
    server: McpServer,
    context: McpServerContext
) {
    server.registerTool(
        "svg_save_project",
        {
            description: "Save the current SVG as an mcpsvg project file (.mcpsvg). This preserves the full project state so it can be reopened later.",
            inputSchema: {
                path: z
                    .string()
                    .describe(
                        "Absolute file path to save the .mcpsvg project file (e.g. /home/user/logos/brand.mcpsvg)"
                    ),
                name: z
                    .string()
                    .optional()
                    .describe('Friendly project name (e.g. "Brand Logo")'),
            },
        },
        async ({ path: filePath, name }) => {
            const svg = context.svgDocument.getSvg();
            if (!svg) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: "No SVG content to save. Create or load an SVG first.",
                        },
                    ],
                    isError: true,
                };
            }

            // Ensure .mcpsvg extension
            let savePath = filePath;
            if (!savePath.endsWith(".mcpsvg")) {
                savePath += ".mcpsvg";
            }

            // Ensure directory exists
            const dir = path.dirname(savePath);
            fs.mkdirSync(dir, { recursive: true });

            const projectName =
                name || context.svgDocument.projectName || "Untitled";
            const project = {
                mcpsvg: "0.1.0",
                name: projectName,
                svg,
            };

            fs.writeFileSync(
                savePath,
                JSON.stringify(project, null, 2),
                "utf-8"
            );
            context.svgDocument.setProject(savePath, projectName);

            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Project saved to ${savePath}`,
                    },
                ],
            };
        }
    );
}
