import * as vscode from "vscode";
import DocumentDecoration from "./documentDecoration";
import Settings from "./settings";

export default class DocumentDecorationManager {
    private showError = true;
    private documents = new Map<string, DocumentDecoration>();

    public reset() {
        this.documents.forEach((document, key) => {
            document.dispose();
        });
        this.documents.clear();
        this.updateAllDocuments();
    }

    public updateDocument(document: vscode.TextDocument) {
        const documentDecoration = this.getDocumentDecorations(document);
        if (documentDecoration) {
            documentDecoration.triggerUpdateDecorations();
        }
    }

    public onDidChangeTextDocument(
        document: vscode.TextDocument,
        contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        const documentDecoration = this.getDocumentDecorations(document);
        if (documentDecoration) {
            documentDecoration.triggerUpdateDecorations();
        }
    }

    public onDidCloseTextDocument(closedDocument: vscode.TextDocument) {
        const uri = closedDocument.uri.toString();
        const document = this.documents.get(uri);
        if (document !== undefined) {
            document.dispose();
        }

        this.documents.delete(closedDocument.uri.toString());
        this.updateAllDocuments();
    }

    public updateAllDocuments() {
        vscode.window.visibleTextEditors.forEach((editor) => {
            this.updateDocument(editor.document);
        });
    }

    private getDocumentDecorations(document: vscode.TextDocument): DocumentDecoration | undefined {
        if (!this.isValidDocument(document)) {
            return;
        }

        const uri = document.uri.toString();
        let documentDecorations = this.documents.get(uri);

        if (documentDecorations === undefined) {
            try {
                const settings = new Settings({ languageID: document.languageId });
                documentDecorations = new DocumentDecoration(uri, settings);
                this.documents.set(uri, documentDecorations);
            } catch (error) {
                if (error instanceof Error) {
                    if (this.showError) {
                        vscode.window.showErrorMessage("BracketPair Settings: " + error.message);

                        // Don't spam errors
                        this.showError = false;
                        setTimeout(() => {
                            this.showError = true;
                        }, 3000);
                    }
                }
                return;
            }
        }

        return documentDecorations;
    }

    private isValidDocument(document?: vscode.TextDocument): boolean {
        if (document === undefined) {
            return false;
        }

        if (document.lineCount === 0)
        {
            return false;
        }

        return document.uri.scheme === "file" || document.uri.scheme === "untitled";
    }
}
