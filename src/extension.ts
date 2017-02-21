import * as vscode from "vscode";
import DocumentDecorationManager from "./documentDecorationManager";

export function activate(context: vscode.ExtensionContext) {
    const documentDecorationManager = new DocumentDecorationManager();

    vscode.workspace.onDidChangeConfiguration((event) => {
        // console.log("onDidChangeConfiguration");
        documentDecorationManager.reset();
    }, null, context.subscriptions);

    vscode.window.onDidChangeVisibleTextEditors(() => {
        // console.log("onDidChangeVisibleTextEditors");
        documentDecorationManager.updateAllDocuments();
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument((event) => {
        // console.log("onDidChangeTextDocument");
        documentDecorationManager.onDidChangeTextDocument(event.document, event.contentChanges);

    }, null, context.subscriptions);

    vscode.workspace.onDidCloseTextDocument((event) => {
        // console.log("onDidCloseTextDocument");
        documentDecorationManager.onDidCloseTextDocument(event);

    }, null, context.subscriptions);

    documentDecorationManager.reset();
}

// tslint:disable-next-line:no-empty
export function deactivate() {
}
