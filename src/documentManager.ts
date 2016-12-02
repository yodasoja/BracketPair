'use strict';
import * as vscode from 'vscode';
import * as assert from 'assert';
import Document from "./document";
import BracketPair from "./bracketPair";

export default class DocumentManager {
    // TODO Is there a more efficient way to do this? Use URI as key maybe?
    documents = new Map<vscode.TextDocument, Document>();
    readonly bracketPairs: BracketPair[] = [];

    constructor() {
        let settings = vscode.workspace.getConfiguration().get("bracketPair.pairColors") as [{}];

        for (let setting of settings) {
            let firstBracket = setting[0] as string;
            assert(firstBracket.length === 1, "User defined open bracket must be one character");
            let secondBracket = setting[1] as string;
            assert(secondBracket.length === 1, "User defined close bracket must only be one character");
            let colors = setting[2] as string[];
            assert(colors.length !== 0,  "User defined bracket colors must not be empty");
            let orphanColor = setting[3] as string;
            assert(orphanColor.length !== 0, "User defined orphan color must not be empty");
            this.bracketPairs.push(new BracketPair(firstBracket, secondBracket, colors, orphanColor));
        }
    }

    public updateDecorations(textEditor: vscode.TextEditor) {
        this.getDocument(textEditor).triggerUpdateDecorations();
    }

    public onDidChangeTextDocument(textEditor: vscode.TextEditor, contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.getDocument(textEditor).onDidChangeTextDocument(contentChanges);
    }

    private getDocument(textEditor: vscode.TextEditor) {
        let document = this.documents.get(textEditor.document);

        if (document === undefined) {
            document = new Document(textEditor, this.bracketPairs);
            this.documents.set(textEditor.document, document);
        }

        return document;
    }
}