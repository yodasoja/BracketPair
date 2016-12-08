'use strict';

import * as vscode from 'vscode';
import DocumentManager from "./documentManager";

export function activate(context: vscode.ExtensionContext) {
    let documentManager = new DocumentManager();

    let activeEditor = vscode.window.activeTextEditor;

    vscode.window.visibleTextEditors.forEach(editor => {
        if (editor) {
            documentManager.updateDecorations(editor);
        }
    });

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
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor) {
                    documentManager.updateDecorations(editor);
                }
            });
        }
    }, null, context.subscriptions);
}

export function deactivate() {
}