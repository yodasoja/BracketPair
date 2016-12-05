'use strict';
import * as vscode from 'vscode';
import Document from "./document";
import BracketPair from "./bracketPair";

export default class DocumentManager {
    documents = new Map<string, Document>();
    readonly bracketPairs: BracketPair[];
    readonly timeOut: number;

    constructor(settings: BracketPair[], timeOut: number) {
        this.timeOut = timeOut;
        this.bracketPairs = settings;
    }

    public updateDecorations(textEditor: vscode.TextEditor) {
        this.getDocument(textEditor).triggerUpdateDecorations();
    }

    public onDidChangeTextDocument(textEditor: vscode.TextEditor, contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.getDocument(textEditor).onDidChangeTextDocument(contentChanges);
    }

    public onDidCloseTextDocument(closedDocument: vscode.TextDocument) {
        this.documents.delete(closedDocument.uri.toString());
    }

    private getDocument(textEditor: vscode.TextEditor): Document {
        let document = this.documents.get(textEditor.document.uri.toString());

        if (document === undefined) {
            document = new Document(textEditor.document.uri.toString(), this.bracketPairs, this.timeOut);
            this.documents.set(textEditor.document.uri.toString(), document);
        }

        return document;
    }
}