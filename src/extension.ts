import * as vscode from "vscode";
import fs from "fs";
import os from "os";
import path from "path";
import { SvgDocument } from "./svg-document";
import { SvgEditorProvider } from "./webview-provider";
import { createMcpApp } from "./mcp-server";
import type { Server as HttpServer } from "http";

let httpServer: HttpServer | null = null;

// ── Claude Code MCP auto-registration ──

const CLAUDE_CONFIG = path.join(os.homedir(), ".claude.json");

function registerWithClaudeCode(port: number) {
    try {
        if (!fs.existsSync(CLAUDE_CONFIG)) return;
        const raw = fs.readFileSync(CLAUDE_CONFIG, "utf-8");
        const config = JSON.parse(raw);
        if (!config.mcpServers) config.mcpServers = {};
        config.mcpServers.inkpilot = {
            type: "sse",
            url: `http://localhost:${port}/sse`,
        };
        fs.writeFileSync(
            CLAUDE_CONFIG,
            JSON.stringify(config, null, 2),
            "utf-8"
        );
    } catch {
        // Claude Code not installed or config unreadable — skip silently
    }
}

function unregisterFromClaudeCode() {
    try {
        if (!fs.existsSync(CLAUDE_CONFIG)) return;
        const raw = fs.readFileSync(CLAUDE_CONFIG, "utf-8");
        const config = JSON.parse(raw);
        if (config.mcpServers?.inkpilot) {
            delete config.mcpServers.inkpilot;
            fs.writeFileSync(
                CLAUDE_CONFIG,
                JSON.stringify(config, null, 2),
                "utf-8"
            );
        }
    } catch {
        // Best-effort cleanup
    }
}

export function activate(context: vscode.ExtensionContext) {
    // Singleton SvgDocument for the manual panel (MCP create-from-scratch)
    const svgDocument = new SvgDocument();
    const editorProvider = new SvgEditorProvider(context, svgDocument);

    // ── Register custom editor for .inkp files ──
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            "inkpilot.svgEditor",
            editorProvider,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    // ── Commands ──
    context.subscriptions.push(
        vscode.commands.registerCommand("inkpilot.openEditor", () => {
            editorProvider.openEditor();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("inkpilot.startServer", () => {
            if (httpServer) {
                vscode.window.showInformationMessage(
                    "inkpilot MCP server is already running."
                );
                return;
            }
            startServer(context, editorProvider);
        })
    );

    // Save: if there's a file-backed custom editor, save it natively.
    // Otherwise fall back to "Save As" for the manual panel.
    context.subscriptions.push(
        vscode.commands.registerCommand("inkpilot.saveProject", async () => {
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
                await vscode.commands.executeCommand("inkpilot.saveProjectAs");
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("inkpilot.saveProjectAs", async () => {
            const activeDoc = editorProvider.getActiveSvgDocument();
            if (activeDoc.isEmpty) {
                vscode.window.showWarningMessage(
                    "Nothing to save — create an SVG first."
                );
                return;
            }
            const uri = await vscode.window.showSaveDialog({
                filters: { "inkpilot Project": ["inkp"] },
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
        vscode.commands.registerCommand("inkpilot.openProject", async () => {
            const uris = await vscode.window.showOpenDialog({
                filters: { "inkpilot Project": ["inkp"] },
                canSelectMany: false,
            });
            if (!uris || uris.length === 0) return;
            // Open with the custom editor
            await vscode.commands.executeCommand(
                "vscode.openWith",
                uris[0],
                "inkpilot.svgEditor"
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("inkpilot.exportSvg", async () => {
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
        .getConfiguration("inkpilot")
        .get<number>("port", 7100);
    const mcpStdioPath = vscode.Uri.joinPath(
        context.extensionUri,
        "dist",
        "mcp-stdio.js"
    ).fsPath;

    context.subscriptions.push(
        vscode.lm.registerMcpServerDefinitionProvider("inkpilot.mcpServer", {
            provideMcpServerDefinitions: async () => [
                new vscode.McpStdioServerDefinition(
                    "inkpilot",
                    "node",
                    [mcpStdioPath],
                    { INKPILOT_PORT: String(port) },
                    "0.1.0"
                ),
            ],
        })
    );

    // ── Register with Claude Code ──
    registerWithClaudeCode(port);
}

function writeProject(svgDoc: SvgDocument, filePath: string) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const name = path.basename(filePath, ".inkp");
    svgDoc.setProject(filePath, name);
    fs.writeFileSync(filePath, svgDoc.toProjectJson(), "utf-8");
}

function startServer(
    context: vscode.ExtensionContext,
    editorProvider: SvgEditorProvider
) {
    const port = vscode.workspace
        .getConfiguration("inkpilot")
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
        const msg = `inkpilot MCP server running on http://localhost:${port}/sse`;
        vscode.window.showInformationMessage(msg);
        console.log(msg);
    });

    httpServer.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
            vscode.window.showErrorMessage(
                `Port ${port} is in use. Change inkpilot.port in settings or stop the other process.`
            );
        } else {
            vscode.window.showErrorMessage(
                `inkpilot server error: ${err.message}`
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
    unregisterFromClaudeCode();
}
