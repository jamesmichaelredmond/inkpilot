import * as vscode from 'vscode';
import { SvgDocument } from './svg-document';
import { SvgEditorProvider } from './webview-provider';
import { createMcpApp } from './mcp-server';
import type { Server as HttpServer } from 'http';

let httpServer: HttpServer | null = null;

export function activate(context: vscode.ExtensionContext) {
  const svgDocument = new SvgDocument();
  const editorProvider = new SvgEditorProvider(context, svgDocument);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('mcpsvg.openEditor', () => {
      editorProvider.openEditor();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mcpsvg.startServer', () => {
      if (httpServer) {
        vscode.window.showInformationMessage('mcpsvg MCP server is already running.');
        return;
      }
      startServer(context, svgDocument, editorProvider);
    }),
  );

  // Auto-start MCP server on activation
  startServer(context, svgDocument, editorProvider);

  // Listen for SVG document changes to push to webview
  svgDocument.on('change', () => {
    editorProvider.updateWebview();
  });
}

function startServer(
  context: vscode.ExtensionContext,
  svgDocument: SvgDocument,
  editorProvider: SvgEditorProvider,
) {
  const port = vscode.workspace.getConfiguration('mcpsvg').get<number>('port', 7100);

  const app = createMcpApp({
    svgDocument,
    notifyWebview: () => editorProvider.updateWebview(),
    openEditor: () => editorProvider.openEditor(),
    requestScreenshot: () => editorProvider.requestScreenshot(),
  });

  httpServer = app.listen(port, () => {
    const msg = `mcpsvg MCP server running on http://localhost:${port}/sse`;
    vscode.window.showInformationMessage(msg);
    console.log(msg);
  });

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      vscode.window.showErrorMessage(
        `Port ${port} is in use. Change mcpsvg.port in settings or stop the other process.`,
      );
    } else {
      vscode.window.showErrorMessage(`mcpsvg server error: ${err.message}`);
    }
  });

  context.subscriptions.push({
    dispose: () => {
      if (httpServer) {
        httpServer.close();
        httpServer = null;
      }
    },
  });
}

export function deactivate() {
  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }
}
