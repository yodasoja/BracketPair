'use strict';

import * as vscode from 'vscode';
import DocumentManager from "./documentManager";

export function activate(context: vscode.ExtensionContext) {
    let documentManager = new DocumentManager();
    let activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        documentManager.updateDecorations(activeEditor);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (activeEditor) {
            documentManager.updateDecorations(activeEditor);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            documentManager.onDidChangeTextDocument(activeEditor, event.contentChanges);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidCloseTextDocument(event => {
        if (activeEditor) {
            documentManager.onDidCloseTextDocument(event);
        }
    }, null, context.subscriptions);

}

export function deactivate() {
}