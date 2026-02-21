import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSvgGuidelines } from "./svg-guidelines";

export function registerAllResources(server: McpServer) {
    registerSvgGuidelines(server);
}
