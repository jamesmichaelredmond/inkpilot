import * as vscode from 'vscode';
import type { SvgDocument } from './svg-document';

export class SvgEditorProvider {
  private panel: vscode.WebviewPanel | null = null;
  private isUpdatingFromWebview = false;
  private screenshotResolvers: Array<(dataUrl: string) => void> = [];

  constructor(
    private context: vscode.ExtensionContext,
    private svgDocument: SvgDocument,
  ) {}

  openEditor() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'mcpsvg.editor',
      'mcpsvg Editor',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
        ],
      },
    );

    this.panel.webview.html = this.getHtml(this.panel.webview);

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'svgChanged':
            this.isUpdatingFromWebview = true;
            this.svgDocument.set(message.svg);
            this.isUpdatingFromWebview = false;
            break;
          case 'screenshot': {
            const resolver = this.screenshotResolvers.shift();
            if (resolver) {
              resolver(message.dataUrl);
            }
            break;
          }
        }
      },
      undefined,
      this.context.subscriptions,
    );

    this.panel.onDidDispose(() => {
      this.panel = null;
      // Reject any pending screenshot requests
      for (const resolver of this.screenshotResolvers) {
        resolver('');
      }
      this.screenshotResolvers = [];
    });

    // Send current SVG if it exists
    if (!this.svgDocument.isEmpty) {
      this.updateWebview();
    }
  }

  updateWebview() {
    if (this.panel && !this.isUpdatingFromWebview) {
      this.panel.webview.postMessage({
        type: 'updateSvg',
        svg: this.svgDocument.getSvg(),
      });
    }
  }

  async requestScreenshot(): Promise<string> {
    if (!this.panel) {
      throw new Error('Editor is not open. Use svg_create or open the editor first.');
    }
    return new Promise<string>((resolve) => {
      this.screenshotResolvers.push(resolve);
      this.panel!.webview.postMessage({ type: 'requestScreenshot' });
      // Timeout after 5 seconds
      setTimeout(() => {
        const idx = this.screenshotResolvers.indexOf(resolve);
        if (idx !== -1) {
          this.screenshotResolvers.splice(idx, 1);
          resolve('');
        }
      }, 5000);
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js'),
    );
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.css'),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${stylesUri}" rel="stylesheet">
  <title>mcpsvg Editor</title>
</head>
<body>
  <div id="app">
    <div id="toolbar"></div>
    <div id="main">
      <div id="canvas-container">
        <canvas id="canvas"></canvas>
      </div>
      <div id="properties-panel"></div>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
