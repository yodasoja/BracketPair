import * as vscode from "vscode";
import DocumentDecorationManager from "./documentDecorationManager";

export function activate(context: vscode.ExtensionContext) {
    const documentDecorationManager = new DocumentDecorationManager();

    let activeEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

    vscode.workspace.onDidChangeConfiguration((event) => {
        documentDecorationManager.reset();
    });

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        activeEditor = editor;

        if (activeEditor) {
            documentDecorationManager.updateDocument(editor.document);
        }
    }, null, context.subscriptions);

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        activeEditor = editor;

        documentDecorationManager.updateAllDocuments();

    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument((event) => {
        if (activeEditor && event.document === activeEditor.document) {
            documentDecorationManager.onDidChangeTextDocument(activeEditor.document, event.contentChanges);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidCloseTextDocument((event) => {
        if (activeEditor) {
            documentDecorationManager.onDidCloseTextDocument(event);
        }
    }, null, context.subscriptions);

    documentDecorationManager.reset();
}

// tslint:disable-next-line:no-empty
export function deactivate() {
}
