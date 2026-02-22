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
            description:
                "Save the current SVG as a .mcpsvg project file for later reopening.",
            inputSchema: {
                path: z.string().describe("Absolute path for the .mcpsvg file"),
                name: z
                    .string()
                    .optional()
                    .describe("Project name"),
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
                mcpsvg: "0.2.0",
                name: projectName,
                svg,
                artboard: { color: context.svgDocument.artboardColor },
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
