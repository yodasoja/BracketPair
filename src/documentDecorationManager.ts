import * as vscode from "vscode";
import DocumentDecoration from "./documentDecoration";
import Settings from "./settings";

export default class DocumentDecorationManager {
    private documents = new Map<string, DocumentDecoration>();

    public reset() {
        this.documents.forEach((document, key) => {
            document.dispose();
        });
        this.documents.clear();
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
        const uri = closedDocument.uri.toString();
        const document = this.documents.get(uri);
        if (document !== undefined) {
            document.dispose();
        }

        this.documents.delete(closedDocument.uri.toString());
    }

    private getDocumentDecorations(document: vscode.TextDocument): DocumentDecoration {
        const uri = document.uri.toString();
        let documentDecorations = this.documents.get(uri);

        if (documentDecorations === undefined) {
            documentDecorations = new DocumentDecoration(uri, new Settings({ languageID: document.languageId }));
            this.documents.set(uri, documentDecorations);
        }

        return documentDecorations;
    }
}
