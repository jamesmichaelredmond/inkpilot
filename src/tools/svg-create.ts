import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpServerContext } from '../mcp-server';

export function registerSvgCreate(server: McpServer, context: McpServerContext) {
  server.tool(
    'svg_create',
    'Create a new SVG with the given markup. Opens the visual editor panel if not already open.',
    { markup: z.string().describe('Complete SVG markup string (e.g. <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">...</svg>)') },
    async ({ markup }) => {
      context.openEditor();
      context.svgDocument.create(markup);
      const count = context.svgDocument.listElements().length;
      return {
        content: [{
          type: 'text',
          text: `SVG created and displayed in editor. ${count} element(s) found.`,
        }],
      };
    },
  );
}
