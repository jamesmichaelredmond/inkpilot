import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServerContext } from "../mcp-server";
import { registerSvgCreate } from "./svg-create";
import { registerSvgSet } from "./svg-set";
import { registerSvgGet } from "./svg-get";
import { registerSvgModifyElement } from "./svg-modify-element";
import { registerSvgListElements } from "./svg-list-elements";
import { registerSvgSaveProject } from "./svg-save-project";
import { registerSvgOpenProject } from "./svg-open-project";
import { registerSvgExport } from "./svg-export";
import { registerSvgValidateAndScreenshot } from "./svg-validate-and-screenshot";
import { registerSvgGetGuidelines } from "./svg-get-guidelines";

export function registerAllTools(server: McpServer, context: McpServerContext) {
    registerSvgCreate(server, context);
    registerSvgSet(server, context);
    registerSvgGet(server, context);
    registerSvgModifyElement(server, context);
    registerSvgListElements(server, context);
    registerSvgSaveProject(server, context);
    registerSvgOpenProject(server, context);
    registerSvgExport(server, context);
    registerSvgValidateAndScreenshot(server, context);
    registerSvgGetGuidelines(server);
}
