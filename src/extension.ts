'use strict';

import * as vscode from 'vscode';
import DocumentDecorationManager from "./documentDecorationManager";

export function activate(context: vscode.ExtensionContext) {
    let documentDecorationManager = new DocumentDecorationManager();

    let activeEditor = vscode.window.activeTextEditor;

    documentDecorationManager.updateVisibleEditors();

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (activeEditor) {
            documentDecorationManager.updateDecorations(activeEditor.document);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            documentDecorationManager.onDidChangeTextDocument(activeEditor.document, event.contentChanges);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidCloseTextDocument(event => {
        if (activeEditor) {
            documentDecorationManager.onDidCloseTextDocument(event);
        }
    }, null, context.subscriptions);
}

export function deactivate() {
}