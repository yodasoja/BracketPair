'use strict';

import * as vscode from 'vscode';
import DocumentDecorationManager from "./documentDecorationManager";

export function activate(context: vscode.ExtensionContext) {
    let documentManager = new DocumentDecorationManager();

    let activeEditor = vscode.window.activeTextEditor;

    vscode.window.visibleTextEditors.forEach(editor => {
        if (editor) {
            documentManager.updateDecorations(editor.document);
        }
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (activeEditor) {
            documentManager.updateDecorations(activeEditor.document);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            documentManager.onDidChangeTextDocument(activeEditor.document, event.contentChanges);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidCloseTextDocument(event => {
        if (activeEditor) {
            documentManager.onDidCloseTextDocument(event);
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor) {
                    documentManager.updateDecorations(editor.document);
                }
            });
        }
    }, null, context.subscriptions);
}

export function deactivate() {
}