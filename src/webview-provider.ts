import * as vscode from "vscode";
import path from "path";
import { SvgDocument } from "./svg-document";

/** Per-custom-editor state. */
interface EditorInstance {
    document: vscode.TextDocument;
    panel: vscode.WebviewPanel;
    svgDoc: SvgDocument;
    /** When true, suppress onDidChangeTextDocument handler (we caused the edit). */
    suppressSync: boolean;
}

export class SvgEditorProvider implements vscode.CustomTextEditorProvider {
    // ── Custom editor instances (file-backed .mcpsvg) ──
    private editors = new Map<string, EditorInstance>();
    private activeEditorUri: string | null = null;

    // ── Manual panel (MCP create-from-scratch, no file yet) ──
    private manualPanel: vscode.WebviewPanel | null = null;

    // ── Shared ──
    private screenshotResolvers: Array<(dataUrl: string) => void> = [];

    constructor(
        private extensionContext: vscode.ExtensionContext,
        /** Singleton SvgDocument used by the manual (non-file) panel. */
        private manualSvgDoc: SvgDocument
    ) {}

    // ═══════════════════════════════════════════════════════════════════
    //  CustomTextEditorProvider — VS Code calls this for .mcpsvg files
    // ═══════════════════════════════════════════════════════════════════

    resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): void {
        const uri = document.uri.toString();
        const svgDoc = new SvgDocument();

        // Parse initial content
        const project = SvgDocument.fromProjectJson(document.getText());
        if (project) {
            svgDoc.create(project.svg);
            svgDoc.artboardColor = project.artboardColor;
        }

        const instance: EditorInstance = {
            document,
            panel: webviewPanel,
            svgDoc,
            suppressSync: false,
        };

        this.editors.set(uri, instance);
        this.activeEditorUri = uri;

        // Setup webview
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionContext.extensionUri, "dist"),
            ],
        };
        webviewPanel.webview.html = this.getHtml(webviewPanel.webview);

        // Send initial SVG after webview loads
        const svg = svgDoc.getSvg();
        if (svg) {
            setTimeout(() => {
                webviewPanel.webview.postMessage({ type: "updateSvg", svg });
                webviewPanel.webview.postMessage({ type: "updateArtboard", color: svgDoc.artboardColor });
            }, 100);
        }

        // Handle messages from webview
        const msgDisposable = webviewPanel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.type) {
                    case "screenshot": {
                        const resolver = this.screenshotResolvers.shift();
                        if (resolver) resolver(message.dataUrl);
                        break;
                    }
                    case "save":
                        vscode.commands.executeCommand(
                            "workbench.action.files.save"
                        );
                        break;
                    case "saveAs":
                        vscode.commands.executeCommand("mcpsvg.saveProjectAs");
                        break;
                    case "export":
                        vscode.commands.executeCommand("mcpsvg.exportSvg");
                        break;
                }
            }
        );

        // Track which editor is active
        const viewStateDisposable = webviewPanel.onDidChangeViewState(() => {
            if (webviewPanel.active) {
                this.activeEditorUri = uri;
            }
        });

        // Listen for external document changes (undo, redo, other edits)
        const docChangeDisposable = vscode.workspace.onDidChangeTextDocument(
            (e) => {
                if (e.document.uri.toString() !== uri) return;
                if (instance.suppressSync) return;
                if (e.contentChanges.length === 0) return;

                // Re-parse and push to webview
                const updated = SvgDocument.fromProjectJson(
                    e.document.getText()
                );
                if (updated) {
                    svgDoc.create(updated.svg);
                    svgDoc.artboardColor = updated.artboardColor;
                    webviewPanel.webview.postMessage({
                        type: "updateSvg",
                        svg: updated.svg,
                    });
                    webviewPanel.webview.postMessage({
                        type: "updateArtboard",
                        color: updated.artboardColor,
                    });
                }
            }
        );

        // Cleanup
        webviewPanel.onDidDispose(() => {
            this.editors.delete(uri);
            if (this.activeEditorUri === uri) {
                this.activeEditorUri = null;
            }
            msgDisposable.dispose();
            viewStateDisposable.dispose();
            docChangeDisposable.dispose();
        });
    }

    /** Flush the current SvgDocument state into the backing TextDocument. */
    private async applyEditToDocument(instance: EditorInstance): Promise<void> {
        const { document, svgDoc } = instance;
        const svg = svgDoc.getSvg();

        // Read current project JSON (preserve name, version, etc.)
        let project: Record<string, unknown> = {};
        try {
            project = JSON.parse(document.getText());
        } catch {
            project = { mcpsvg: "0.2.0", name: "Untitled" };
        }
        project.svg = svg;
        project.artboard = { color: svgDoc.artboardColor };

        const newText = JSON.stringify(project, null, 2);
        if (newText === document.getText()) return; // no change

        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            newText
        );

        instance.suppressSync = true;
        await vscode.workspace.applyEdit(edit);
        instance.suppressSync = false;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Manual panel — MCP create-from-scratch workflow (no file yet)
    // ═══════════════════════════════════════════════════════════════════

    updatePanelTitle(): void {
        if (!this.manualPanel) return;
        if (this.manualSvgDoc.projectPath) {
            this.manualPanel.title = path.basename(this.manualSvgDoc.projectPath);
        } else {
            this.manualPanel.title = "mcpsvg Editor";
        }
    }

    openEditor(): void {
        // If a custom editor is active, just reveal it
        if (this.activeEditorUri) {
            const instance = this.editors.get(this.activeEditorUri);
            if (instance) {
                instance.panel.reveal();
                return;
            }
        }

        if (this.manualPanel) {
            this.manualPanel.reveal();
            return;
        }

        this.manualPanel = vscode.window.createWebviewPanel(
            "mcpsvg.editor",
            "mcpsvg Editor",
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(
                        this.extensionContext.extensionUri,
                        "dist"
                    ),
                ],
            }
        );

        this.activeEditorUri = null; // null = manual panel is active

        this.manualPanel.webview.html = this.getHtml(this.manualPanel.webview);

        const projectListener = () => this.updatePanelTitle();
        this.manualSvgDoc.on("project", projectListener);

        this.manualPanel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.type) {
                    case "screenshot": {
                        const resolver = this.screenshotResolvers.shift();
                        if (resolver) resolver(message.dataUrl);
                        break;
                    }
                    case "save":
                        vscode.commands.executeCommand("mcpsvg.saveProject");
                        break;
                    case "saveAs":
                        vscode.commands.executeCommand("mcpsvg.saveProjectAs");
                        break;
                    case "export":
                        vscode.commands.executeCommand("mcpsvg.exportSvg");
                        break;
                }
            },
            undefined,
            this.extensionContext.subscriptions
        );

        this.manualPanel.onDidDispose(() => {
            this.manualSvgDoc.off("project", projectListener);
            this.manualPanel = null;
            for (const resolver of this.screenshotResolvers) resolver("");
            this.screenshotResolvers = [];
        });

        // Send current SVG if available
        if (!this.manualSvgDoc.isEmpty) {
            this.pushToManualPanel();
        }
    }

    private pushToManualPanel(): void {
        if (this.manualPanel) {
            this.manualPanel.webview.postMessage({
                type: "updateSvg",
                svg: this.manualSvgDoc.getSvg(),
            });
            this.manualPanel.webview.postMessage({
                type: "updateArtboard",
                color: this.manualSvgDoc.artboardColor,
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Public API — used by MCP context wiring in extension.ts
    // ═══════════════════════════════════════════════════════════════════

    /** Get the SvgDocument for the currently active editor (custom or manual). */
    getActiveSvgDocument(): SvgDocument {
        if (this.activeEditorUri) {
            const instance = this.editors.get(this.activeEditorUri);
            if (instance) return instance.svgDoc;
        }
        return this.manualSvgDoc;
    }

    /**
     * Push current SVG state to the active webview.
     * For custom editors, also syncs the change into the TextDocument.
     */
    updateWebview(): void {
        if (this.activeEditorUri) {
            const instance = this.editors.get(this.activeEditorUri);
            if (instance) {
                const svg = instance.svgDoc.getSvg();
                instance.panel.webview.postMessage({ type: "updateSvg", svg });
                instance.panel.webview.postMessage({ type: "updateArtboard", color: instance.svgDoc.artboardColor });
                this.applyEditToDocument(instance);
                return;
            }
        }

        if (this.manualPanel) {
            this.pushToManualPanel();
        }
    }

    /** Get the active custom editor's TextDocument URI, if any. */
    getActiveDocumentUri(): vscode.Uri | null {
        if (this.activeEditorUri) {
            const instance = this.editors.get(this.activeEditorUri);
            if (instance) return instance.document.uri;
        }
        return null;
    }

    async requestScreenshot(): Promise<string> {
        let panel: vscode.WebviewPanel | null = null;
        if (this.activeEditorUri) {
            panel = this.editors.get(this.activeEditorUri)?.panel ?? null;
        }
        if (!panel) panel = this.manualPanel;
        if (!panel) {
            throw new Error(
                "Editor is not open. Use svg_create or open the editor first."
            );
        }

        return new Promise<string>((resolve) => {
            this.screenshotResolvers.push(resolve);
            panel!.webview.postMessage({ type: "requestScreenshot" });
            setTimeout(() => {
                const idx = this.screenshotResolvers.indexOf(resolve);
                if (idx !== -1) {
                    this.screenshotResolvers.splice(idx, 1);
                    resolve("");
                }
            }, 5000);
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Webview HTML — shared by both paths
    // ═══════════════════════════════════════════════════════════════════

    private getHtml(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.extensionContext.extensionUri,
                "dist",
                "webview.js"
            )
        );
        const stylesUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.extensionContext.extensionUri,
                "dist",
                "webview.css"
            )
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
        <div id="artboard"></div>
        <img id="svg-preview" alt="">
      </div>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
