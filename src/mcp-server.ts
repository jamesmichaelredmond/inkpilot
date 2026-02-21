import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import type { SvgDocument } from './svg-document';
import { registerAllTools } from './tools';

export interface McpServerContext {
  svgDocument: SvgDocument;
  notifyWebview: () => void;
  openEditor: () => void;
  requestScreenshot: () => Promise<string>;
}

export function createMcpApp(context: McpServerContext) {
  const app = express();

  const sessions = new Map<string, SSEServerTransport>();

  app.get('/sse', async (req, res) => {
    // Each SSE connection gets its own McpServer instance
    const server = new McpServer(
      { name: 'mcpsvg', version: '0.1.0' },
      { capabilities: { tools: {} } },
    );

    registerAllTools(server, context);

    const transport = new SSEServerTransport('/messages', res);
    sessions.set(transport.sessionId, transport);

    res.on('close', () => {
      sessions.delete(transport.sessionId);
    });

    await server.connect(transport);
  });

  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = sessions.get(sessionId);
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', sessions: sessions.size });
  });

  return app;
}
