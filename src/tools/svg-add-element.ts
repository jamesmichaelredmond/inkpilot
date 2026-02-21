import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpServerContext } from '../mcp-server';

export function registerSvgAddElement(server: McpServer, context: McpServerContext) {
  server.tool(
    'svg_add_element',
    'Add an SVG element (rect, circle, ellipse, path, text, line, polyline, polygon, g, etc.) with attributes.',
    {
      tag: z.string().describe('SVG element tag name (e.g. rect, circle, path, text)'),
      attributes: z.record(z.string()).describe('Element attributes as key-value pairs (e.g. {"cx":"50","cy":"50","r":"25","fill":"blue"})'),
    },
    async ({ tag, attributes }) => {
      context.openEditor();
      const id = context.svgDocument.addElement(tag, attributes);
      return {
        content: [{
          type: 'text',
          text: `Element <${tag}> added with id="${id}".`,
        }],
      };
    },
  );
}
