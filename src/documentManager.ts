'use strict';
import * as vscode from 'vscode';
import Document from "./document";

export default class DocumentManager {
    // TODO Is there a more efficient way to do this? Use URI as key maybe?
    documents = new Map<vscode.TextDocument, Document>();

    public updateDecorations(textEditor: vscode.TextEditor) {
        this.getDocument(textEditor).triggerUpdateDecorations();
    }

    public onDidChangeTextDocument(textEditor: vscode.TextEditor, contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.getDocument(textEditor).onDidChangeTextDocument(contentChanges);
    }

    private getDocument(textEditor: vscode.TextEditor) {
        let document = this.documents.get(textEditor.document);

        if (document === undefined) {
            document = new Document(textEditor);
            this.documents.set(textEditor.document, document);
        }

        return document;
    }
}