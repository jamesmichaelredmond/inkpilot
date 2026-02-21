import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpServerContext } from '../mcp-server';
import { renderSvgToPng } from '../screenshot';

export function registerSvgScreenshot(server: McpServer, context: McpServerContext) {
  server.tool(
    'svg_screenshot',
    'Render the current SVG to a PNG image and return it as base64. Useful for visual feedback.',
    {},
    async () => {
      const svg = context.svgDocument.getSvg();
      if (!svg) {
        return {
          content: [{
            type: 'text',
            text: 'No SVG is currently loaded. Use svg_create first.',
          }],
          isError: true,
        };
      }

      // Try webview screenshot first
      try {
        const dataUrl = await context.requestScreenshot();
        if (dataUrl) {
          const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
          return {
            content: [{
              type: 'image',
              data: base64,
              mimeType: 'image/png',
            }],
          };
        }
      } catch {
        // Webview not available, try resvg fallback
      }

      // Try resvg fallback
      const pngBase64 = await renderSvgToPng(svg);
      if (pngBase64) {
        return {
          content: [{
            type: 'image',
            data: pngBase64,
            mimeType: 'image/png',
          }],
        };
      }

      // Final fallback: return SVG as text
      return {
        content: [
          {
            type: 'text',
            text: 'Could not render PNG (open the editor or install @resvg/resvg-js). Returning SVG source instead:',
          },
          { type: 'text', text: svg },
        ],
      };
    },
  );
}
