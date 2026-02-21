import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import { SvgDocument } from "./svg-document";
import { SvgEditorProvider } from "./webview-provider";
import { createMcpApp } from "./mcp-server";
import type { Server as HttpServer } from "http";

let httpServer: HttpServer | null = null;

export function activate(context: vscode.ExtensionContext) {
    // Singleton SvgDocument for the manual panel (MCP create-from-scratch)
    const svgDocument = new SvgDocument();
    const editorProvider = new SvgEditorProvider(context, svgDocument);

    // ── Register custom editor for .mcpsvg files ──
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            "mcpsvg.svgEditor",
            editorProvider,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    // ── Commands ──
    context.subscriptions.push(
        vscode.commands.registerCommand("mcpsvg.openEditor", () => {
            editorProvider.openEditor();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("mcpsvg.startServer", () => {
            if (httpServer) {
                vscode.window.showInformationMessage(
                    "mcpsvg MCP server is already running."
                );
                return;
            }
            startServer(context, editorProvider);
        })
    );

    // Save: if there's a file-backed custom editor, save it natively.
    // Otherwise fall back to "Save As" for the manual panel.
    context.subscriptions.push(
        vscode.commands.registerCommand("mcpsvg.saveProject", async () => {
            const activeDoc = editorProvider.getActiveSvgDocument();
            if (activeDoc.isEmpty) {
                vscode.window.showWarningMessage(
                    "Nothing to save — create an SVG first."
                );
                return;
            }

            const docUri = editorProvider.getActiveDocumentUri();
            if (docUri) {
                // File-backed custom editor — VS Code native save
                await vscode.commands.executeCommand(
                    "workbench.action.files.save"
                );
            } else if (svgDocument.projectPath) {
                // Manual panel with a known save path
                writeProject(svgDocument, svgDocument.projectPath);
                vscode.window.showInformationMessage(
                    `Saved ${svgDocument.projectName}`
                );
            } else {
                // Manual panel, never saved — prompt Save As
                await vscode.commands.executeCommand("mcpsvg.saveProjectAs");
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("mcpsvg.saveProjectAs", async () => {
            const activeDoc = editorProvider.getActiveSvgDocument();
            if (activeDoc.isEmpty) {
                vscode.window.showWarningMessage(
                    "Nothing to save — create an SVG first."
                );
                return;
            }
            const uri = await vscode.window.showSaveDialog({
                filters: { "mcpsvg Project": ["mcpsvg"] },
                defaultUri: svgDocument.projectPath
                    ? vscode.Uri.file(svgDocument.projectPath)
                    : undefined,
            });
            if (!uri) return;
            writeProject(activeDoc, uri.fsPath);
            vscode.window.showInformationMessage(
                `Project saved to ${uri.fsPath}`
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("mcpsvg.openProject", async () => {
            const uris = await vscode.window.showOpenDialog({
                filters: { "mcpsvg Project": ["mcpsvg"] },
                canSelectMany: false,
            });
            if (!uris || uris.length === 0) return;
            // Open with the custom editor
            await vscode.commands.executeCommand(
                "vscode.openWith",
                uris[0],
                "mcpsvg.svgEditor"
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("mcpsvg.exportSvg", async () => {
            const activeDoc = editorProvider.getActiveSvgDocument();
            if (activeDoc.isEmpty) {
                vscode.window.showWarningMessage(
                    "Nothing to export — create an SVG first."
                );
                return;
            }
            const uri = await vscode.window.showSaveDialog({
                filters: { "SVG Image": ["svg"] },
            });
            if (!uri) return;
            const output = `<?xml version="1.0" encoding="UTF-8"?>\n${activeDoc.getSvg()}\n`;
            fs.writeFileSync(uri.fsPath, output, "utf-8");
            vscode.window.showInformationMessage(
                `SVG exported to ${uri.fsPath}`
            );
        })
    );

    // ── MCP server ──
    startServer(context, editorProvider);

    // ── MCP server discovery ──
    const port = vscode.workspace
        .getConfiguration("mcpsvg")
        .get<number>("port", 7100);
    const mcpStdioPath = vscode.Uri.joinPath(
        context.extensionUri,
        "dist",
        "mcp-stdio.js"
    ).fsPath;

    context.subscriptions.push(
        vscode.lm.registerMcpServerDefinitionProvider("mcpsvg.mcpServer", {
            provideMcpServerDefinitions: async () => [
                new vscode.McpStdioServerDefinition(
                    "mcpsvg",
                    "node",
                    [mcpStdioPath],
                    { MCPSVG_PORT: String(port) },
                    "0.1.0"
                ),
            ],
        })
    );
}

function writeProject(svgDoc: SvgDocument, filePath: string) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, svgDoc.toProjectJson(), "utf-8");
    svgDoc.setProject(filePath);
}

function startServer(
    context: vscode.ExtensionContext,
    editorProvider: SvgEditorProvider
) {
    const port = vscode.workspace
        .getConfiguration("mcpsvg")
        .get<number>("port", 7100);

    // Dynamic MCP context — always points at the active editor's SvgDocument
    const app = createMcpApp({
        get svgDocument() {
            return editorProvider.getActiveSvgDocument();
        },
        notifyWebview: () => editorProvider.updateWebview(),
        openEditor: () => editorProvider.openEditor(),
        requestScreenshot: () => editorProvider.requestScreenshot(),
    });

    httpServer = app.listen(port, () => {
        const msg = `mcpsvg MCP server running on http://localhost:${port}/sse`;
        vscode.window.showInformationMessage(msg);
        console.log(msg);
    });

    httpServer.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
            vscode.window.showErrorMessage(
                `Port ${port} is in use. Change mcpsvg.port in settings or stop the other process.`
            );
        } else {
            vscode.window.showErrorMessage(
                `mcpsvg server error: ${err.message}`
            );
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
