import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpServerContext } from '../mcp-server';
import { registerSvgCreate } from './svg-create';
import { registerSvgSet } from './svg-set';
import { registerSvgGet } from './svg-get';
import { registerSvgAddElement } from './svg-add-element';
import { registerSvgUpdateElement } from './svg-update-element';
import { registerSvgRemoveElement } from './svg-remove-element';
import { registerSvgListElements } from './svg-list-elements';
import { registerSvgScreenshot } from './svg-screenshot';

export function registerAllTools(server: McpServer, context: McpServerContext) {
  registerSvgCreate(server, context);
  registerSvgSet(server, context);
  registerSvgGet(server, context);
  registerSvgAddElement(server, context);
  registerSvgUpdateElement(server, context);
  registerSvgRemoveElement(server, context);
  registerSvgListElements(server, context);
  registerSvgScreenshot(server, context);
}
