import * as vscode from "vscode";
import DocumentDecoration from "./documentDecoration";
import Settings from "./settings";

export default class DocumentDecorationManager {
    private documents = new Map<string, DocumentDecoration>();
    private readonly settings: Settings;

    constructor(settings?: Settings) {
        this.settings = settings !== undefined ? settings : new Settings();
    }

    public updateDecorations(document: vscode.TextDocument) {
        this.getDocumentDecorations(document).triggerUpdateDecorations();
    }

    public onDidChangeTextDocument(
        document: vscode.TextDocument,
        contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.getDocumentDecorations(document).onDidChangeTextDocument(contentChanges);
    }

    public onDidCloseTextDocument(closedDocument: vscode.TextDocument) {
        this.documents.delete(closedDocument.uri.toString());
    }

    private getDocumentDecorations(document: vscode.TextDocument): DocumentDecoration {
        const uri = document.uri.toString();
        let documentDecorations = this.documents.get(uri);

        if (documentDecorations === undefined) {
            documentDecorations = new DocumentDecoration(uri, this.settings);
            this.documents.set(uri, documentDecorations);
        }

        return documentDecorations;
    }
}
