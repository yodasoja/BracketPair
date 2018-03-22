import { TextDocument, TextDocumentContentChangeEvent, TextEditorSelectionChangeEvent, window } from "vscode";
import DocumentDecoration from "./documentDecoration";
import PrismJsLanguages from "./prismJsLanguages";
import Settings from "./settings";
const Prism = require('prismjs/components/prism-core.js');
const loadComponents = require('prismjs/components/index.js');

export default class DocumentDecorationManager {
    private readonly supportedLanguages = new Set(PrismJsLanguages);
    private showError = true;
    private documents = new Map<string, DocumentDecoration>();
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

    public onDidChangeSelection(event: TextEditorSelectionChangeEvent) {
        const documentDecoration = this.getDocumentDecorations(event.textEditor.document);
        if (documentDecoration && documentDecoration.settings.highlightActiveScope) {
            documentDecoration.updateScopeDecorations(event);
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
                const languages = this.getPrismLanguageID(document.languageId);
                const primaryLanguage = languages[0];
                if (!this.supportedLanguages.has(primaryLanguage)) {
                    return;
                }

                const settings = new Settings(primaryLanguage, document.uri);
                loadComponents(languages);
                documentDecorations = new DocumentDecoration(document, Prism, settings);
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

    private getPrismLanguageID(languageID: string): string[] {
        // Some VSCode language ids need to be mapped to match http://prismjs.com/#languages-list
        switch (languageID) {
            case "html": return ["markup", "javascript"];
            case "javascriptreact": return ["jsx"];
            case "jsonc": return ["javascript"];
            case "mathml": return ["markup"];
            case "nunjucks": return ["twig"];
            case "scad": return ["swift"]; // workaround for unsupported language in Prism
            case "svg": return ["markup"];
            case "systemverilog": return ["verilog"];
            case "typescriptreact": return ["tsx"];
            case "vb": return ["vbnet"];
            case "vue": return ["markup", "javascript"];
            case "xml": return ["markup"];
            default: return [languageID];
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
