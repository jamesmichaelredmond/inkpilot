import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs";
import type { McpServerContext } from "../mcp-server";

export function registerSvgOpenProject(
    server: McpServer,
    context: McpServerContext
) {
    server.registerTool(
        "svg_open_project",
        {
            description:
                "Open a .mcpsvg project file and load its SVG into the editor.",
            inputSchema: {
                path: z.string().describe("Absolute path to the .mcpsvg file"),
            },
        },
        async ({ path: filePath }) => {
            if (!fs.existsSync(filePath)) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `File not found: ${filePath}`,
                        },
                    ],
                    isError: true,
                };
            }

            const raw = fs.readFileSync(filePath, "utf-8");
            let project: { mcpsvg?: string; name?: string; svg?: string };
            try {
                project = JSON.parse(raw);
            } catch {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Invalid project file — not valid JSON: ${filePath}`,
                        },
                    ],
                    isError: true,
                };
            }

            if (!project.svg) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: "Project file contains no SVG data.",
                        },
                    ],
                    isError: true,
                };
            }

            context.openEditor();
            context.svgDocument.create(project.svg);
            context.svgDocument.setProject(filePath, project.name);
            context.notifyWebview();

            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Opened project "${project.name || "Untitled"}" from ${filePath}`,
                    },
                ],
            };
        }
    );
}
