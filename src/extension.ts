import { ExtensionContext, window, workspace } from "vscode";
import DocumentDecorationManager from "./documentDecorationManager";

export function activate(context: ExtensionContext) {
    const documentDecorationManager = new DocumentDecorationManager();

    context.subscriptions.push(workspace.onDidChangeConfiguration((event) => {
        documentDecorationManager.reset();
    }));

    context.subscriptions.push(window.onDidChangeVisibleTextEditors(() => {
        documentDecorationManager.updateAllDocuments();
    }));

    context.subscriptions.push(workspace.onDidChangeTextDocument((event) => {
        documentDecorationManager.onDidChangeTextDocument(event.document, event.contentChanges);
    }));

    // vscode.window.onDidChangeTextEditorSelection((event) => {
    //     documentDecorationManager.onDidChangeSelection(event);
    // }, null, context.subscriptions);

    context.subscriptions.push(workspace.onDidCloseTextDocument((event) => {
        documentDecorationManager.onDidCloseTextDocument(event);
    }));

    documentDecorationManager.reset();
}

// tslint:disable-next-line:no-empty
export function deactivate() {
}
