import { TextDocument, TextDocumentContentChangeEvent, TextEditorSelectionChangeEvent, window } from "vscode";
import DocumentDecoration from "./documentDecoration";
import Settings from "./settings";

export default class DocumentDecorationManager {
    private readonly supportedLanguages: Set<string>;
    private showError = true;
    private documents = new Map<string, DocumentDecoration>();

    constructor(supportedLanguages: Set<string>) {
        this.supportedLanguages = supportedLanguages;
    }

    public reset() {
        this.documents.forEach((document, key) => {
            document.dispose();
        });
        this.documents.clear();
        this.updateAllDocuments();
    }

    public updateDocument(document: TextDocument) {
        const documentDecoration = this.getDocumentDecorations(document);
        if (documentDecoration) {
            documentDecoration.triggerUpdateDecorations();
        }
    }

    public onDidOpenTextDocument(document: TextDocument) {
        const documentDecoration = this.getDocumentDecorations(document);
        if (documentDecoration) {
            documentDecoration.triggerUpdateDecorations();
        }
    }

    public onDidChangeTextDocument(
        document: TextDocument,
        contentChanges: TextDocumentContentChangeEvent[]) {
        const documentDecoration = this.getDocumentDecorations(document);
        if (documentDecoration) {
            documentDecoration.onDidChangeTextDocument(contentChanges);
        }
    }

    public onDidCloseTextDocument(closedDocument: TextDocument) {
        const uri = closedDocument.uri.toString();
        const document = this.documents.get(uri);
        if (document !== undefined) {
            document.dispose();
            this.documents.delete(closedDocument.uri.toString());
        }
    }

    public updateAllDocuments() {
        window.visibleTextEditors.forEach((editor) => {
            this.updateDocument(editor.document);
        });
    }

    private getDocumentDecorations(document: TextDocument): DocumentDecoration | undefined {
        if (!this.isValidDocument(document)) {
            return;
        }

        const uri = document.uri.toString();
        let documentDecorations = this.documents.get(uri);

        if (documentDecorations === undefined) {
            try {
                const languageID = this.getPrismLanguageID(document.languageId);
                const settings = new Settings(languageID, document.uri);
                documentDecorations = new DocumentDecoration(document, settings);
                this.documents.set(uri, documentDecorations);
            } catch (error) {
                if (error instanceof Error) {
                    if (this.showError) {
                        window.showErrorMessage("BracketPair Settings: " + error.message);

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

    private getPrismLanguageID(languageID: string) {
        // Some VSCode language ids need to be mapped to match http://prismjs.com/#languages-list
        switch (languageID) {
            case "javascriptreact": return "jsx";
            case "typescriptreact": return "tsx";
            case "jsonc": return "json5";
            case "scad": return "json";
            case "vb" : return  "vbnet";
            default: return languageID;
        }
    }

    private isValidDocument(document?: TextDocument): boolean {
        if (document === undefined || document.lineCount === 0) {
            console.warn("Invalid document");
            return false;
        }

        return document.uri.scheme === "file" || document.uri.scheme === "untitled" || document.uri.scheme === "vsls";
    }
}
