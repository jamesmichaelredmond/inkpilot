import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpServerContext } from '../mcp-server';

export function registerSvgSet(server: McpServer, context: McpServerContext) {
  server.tool(
    'svg_set',
    'Replace the entire SVG content with new markup.',
    { markup: z.string().describe('Complete SVG markup to replace current content') },
    async ({ markup }) => {
      context.svgDocument.set(markup);
      context.notifyWebview();
      const count = context.svgDocument.listElements().length;
      return {
        content: [{
          type: 'text',
          text: `SVG replaced. ${count} element(s) found.`,
        }],
      };
    },
  );
}
