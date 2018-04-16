import { commands, ExtensionContext, window, workspace } from "vscode";
import DocumentDecorationManager from "./documentDecorationManager";
export function activate(context: ExtensionContext) {
    const documentDecorationManager = new DocumentDecorationManager();

    context.subscriptions.push(commands.registerCommand("bracket-pair-colorizer.expandBracketSelection", () => {
        const editor = window.activeTextEditor;
        if (!editor) { return; }
        documentDecorationManager.expandBracketSelection(editor);
    }));

    context.subscriptions.push(commands.registerCommand("bracket-pair-colorizer.undoBracketSelection", () => {
        const editor = window.activeTextEditor;
        if (!editor) { return; }
        documentDecorationManager.undoBracketSelection(editor);
    }));

    context.subscriptions.push(workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("bracketPairColorizer")) {
            documentDecorationManager.reset();
        }
    }));

    context.subscriptions.push(window.onDidChangeVisibleTextEditors(() => {
        documentDecorationManager.updateAllDocuments();
    }));

    context.subscriptions.push(workspace.onDidChangeTextDocument((event) => {
        documentDecorationManager.onDidChangeTextDocument(event.document, event.contentChanges);
    }));

    context.subscriptions.push(workspace.onDidCloseTextDocument((event) => {
        documentDecorationManager.onDidCloseTextDocument(event);
    }));

    context.subscriptions.push(workspace.onDidOpenTextDocument((event) => {
        documentDecorationManager.onDidOpenTextDocument(event);
    }));

    context.subscriptions.push(window.onDidChangeTextEditorSelection((event) => {
        documentDecorationManager.onDidChangeSelection(event);
    }));

    documentDecorationManager.reset();
}

// tslint:disable-next-line:no-empty
export function deactivate() {
}
