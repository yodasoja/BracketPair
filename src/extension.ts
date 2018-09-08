import { commands, ExtensionContext, window, workspace, Event } from "vscode";
import DocumentDecorationManager from "./documentDecorationManager";

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

export async function activate(context: ExtensionContext) {
    // Below new() line calls huge require()s and takes about 2 secs in MBP 15-inch Mid 2014.
    // Wait 0.5 sec to let other plugins be loaded before this plugin.
    await wait(500);
    let documentDecorationManager = new DocumentDecorationManager();

    context.subscriptions.push(
        commands.registerCommand("bracket-pair-colorizer.expandBracketSelection", () => {
            const editor = window.activeTextEditor;
            if (!editor) { return; }
            documentDecorationManager.expandBracketSelection(editor);
        }),

        commands.registerCommand("bracket-pair-colorizer.undoBracketSelection", () => {
            const editor = window.activeTextEditor;
            if (!editor) { return; }
            documentDecorationManager.undoBracketSelection(editor);
        }),

        workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("bracketPairColorizer") ||
                event.affectsConfiguration("editor.lineHeight") ||
                event.affectsConfiguration("editor.fontSize")
            ) {
                documentDecorationManager.Dispose();
                documentDecorationManager = new DocumentDecorationManager();
                documentDecorationManager.updateAllDocuments();
            }
        }),

        window.onDidChangeVisibleTextEditors(() => {
            documentDecorationManager.updateAllDocuments();
        }),
        workspace.onDidChangeTextDocument((event) => {
            documentDecorationManager.onDidChangeTextDocument(event);
        }),
        workspace.onDidCloseTextDocument((event) => {
            documentDecorationManager.onDidCloseTextDocument(event);
        }),
        workspace.onDidOpenTextDocument((event) => {
            documentDecorationManager.onDidOpenTextDocument(event);
        }),
        window.onDidChangeTextEditorSelection((event) => {
            documentDecorationManager.onDidChangeSelection(event);
        }),
    );

    documentDecorationManager.updateAllDocuments();
}

// tslint:disable-next-line:no-empty
export function deactivate() {
}
