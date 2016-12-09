'use strict';
import * as vscode from 'vscode';
import DocumentDecoration from "./documentDecoration";
import Settings from "./settings";

export default class DocumentDecorationManager {
    documents = new Map<string, DocumentDecoration>();
    private readonly settings: Settings;

    constructor(settings?: Settings) {
        this.settings = settings !== undefined ? settings : new Settings();
    }

    public updateVisibleEditors() {
        vscode.window.visibleTextEditors.forEach(editor => {
            if (editor) {
                this.updateDecorations(editor.document);
            }
        });
    }

    public updateDecorations(document: vscode.TextDocument) {
        this.getDocumentDecorations(document).triggerUpdateDecorations();
    }

    public onDidChangeTextDocument(document: vscode.TextDocument, contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.getDocumentDecorations(document).onDidChangeTextDocument(contentChanges);
    }

    public onDidCloseTextDocument(closedDocument: vscode.TextDocument) {
        this.documents.delete(closedDocument.uri.toString());
    }

    private getDocumentDecorations(document: vscode.TextDocument): DocumentDecoration {
        let documentDecorations = this.documents.get(document.uri.toString());

        if (documentDecorations === undefined) {
            documentDecorations = new DocumentDecoration(document.uri.toString(), this.settings);
            this.documents.set(document.uri.toString(), documentDecorations);
        }

        return documentDecorations;
    }
}