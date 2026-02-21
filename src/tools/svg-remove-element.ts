import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpServerContext } from '../mcp-server';

export function registerSvgRemoveElement(server: McpServer, context: McpServerContext) {
  server.tool(
    'svg_remove_element',
    'Remove an element from the SVG by its ID.',
    {
      id: z.string().describe('The element ID to remove (use svg_list_elements to find IDs)'),
    },
    async ({ id }) => {
      const success = context.svgDocument.removeElement(id);
      if (!success) {
        return {
          content: [{
            type: 'text',
            text: `Element with id="${id}" not found. Use svg_list_elements to see available elements.`,
          }],
          isError: true,
        };
      }
      return {
        content: [{
          type: 'text',
          text: `Element "${id}" removed.`,
        }],
      };
    },
  );
}
