import * as vscode from "vscode";
import DocumentDecorationManager from "./documentDecorationManager";

export function activate(context: vscode.ExtensionContext) {
    const documentDecorationManager = new DocumentDecorationManager();

    let activeEditor : vscode.TextEditor | undefined = vscode.window.activeTextEditor;

    vscode.window.visibleTextEditors.forEach((editor) => {
        if (editor && isValidDocument(editor.document)) {
            documentDecorationManager.updateDecorations(editor.document);
        }
    });

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        activeEditor = editor;
        if (activeEditor && isValidDocument(activeEditor.document)) {
            documentDecorationManager.updateDecorations(activeEditor.document);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument((event) => {
        if (activeEditor && event.document === activeEditor.document && isValidDocument(activeEditor.document)) {
            documentDecorationManager.onDidChangeTextDocument(activeEditor.document, event.contentChanges);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidCloseTextDocument((event) => {
        if (activeEditor) {
            documentDecorationManager.onDidCloseTextDocument(event);
        }
    }, null, context.subscriptions);

}

function isValidDocument(document: vscode.TextDocument): boolean {
    return document !== undefined && document.uri.scheme === "file" || document.uri.scheme === "untitled";
}

export function deactivate() {
}
