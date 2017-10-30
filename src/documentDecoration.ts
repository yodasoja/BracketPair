import * as vscode from "vscode";
import Scope from "./scope";
import Settings from "./settings";
import TextLine from "./textLine";

export default class DocumentDecoration {
    private updateDecorationTimeout: NodeJS.Timer | null;

    // This program caches lines, and will only analyze linenumbers including or above a modified line
    private lineToUpdateWhenTimeoutEnds = 0;
    private lines: TextLine[] = [];
    private readonly document: vscode.TextDocument;
    private readonly settings: Settings;

    constructor(document: vscode.TextDocument, settings: Settings) {
        this.settings = settings;
        this.document = document;
    }

    public dispose() {
        this.settings.dispose();
    }

    public onDidChangeTextDocument(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.updateLowestLineNumber(contentChanges);
        this.triggerUpdateDecorations();
    }

    // Lines are stored in an array, if line is requested outside of array bounds
    // add emptys lines until array is correctly sized
    public getLine(index: number, document: vscode.TextDocument): TextLine {
        if (index < this.lines.length) {
            return this.lines[index];
        }
        else {
            if (this.lines.length === 0) {
                this.lines.push(new TextLine(document.lineAt(0).text, this.settings, 0));
            }

            for (let i = this.lines.length; i <= index; i++) {
                const previousLine = this.lines[this.lines.length - 1];
                const newLine =
                    new TextLine(document.lineAt(i).text, this.settings, i, previousLine.copyMultilineContext());

                this.lines.push(newLine);
            }

            const lineToReturn = this.lines[this.lines.length - 1];
            return lineToReturn;
        }
    }

    public triggerUpdateDecorations() {
        if (this.settings.isDisposed) {
            return;
        }

        if (this.settings.timeOutLength > 0) {

            if (this.updateDecorationTimeout) {
                clearTimeout(this.updateDecorationTimeout);
            }

            this.updateDecorationTimeout = setTimeout(() => {
                this.updateDecorations();
            }, this.settings.timeOutLength);
        }
        else {
            this.updateDecorations();
        }
    }

    public updateScopeDecorations(event: vscode.TextEditorSelectionChangeEvent) {
        const scopes: Set<Scope> = new Set<Scope>();

        event.selections.forEach((selection) => {
            const scope = this.getScope(selection.active);

            if (scope) {
                scopes.add(scope);
            }
        });

        const colorMap = new Map<string, vscode.Range[]>();

        // Reduce all the colors/ranges of the lines into a singular map
        for (const scope of scopes) {
            {
                const existingRanges = colorMap.get(scope.color);

                if (existingRanges !== undefined) {
                    existingRanges.push(scope.open.range);
                    existingRanges.push(scope.close.range);
                }
                else {
                    colorMap.set(scope.color, [scope.open.range, scope.close.range]);
                }
            }
        }

        for (const [color, decoration] of this.settings.scopeDecorations) {
            const ranges = colorMap.get(color);
            if (ranges !== undefined) {
                event.textEditor.setDecorations(decoration, ranges);
            }
            else {
                // We must set non-used colors to an empty array
                // or previous decorations will not be invalidated
                event.textEditor.setDecorations(decoration, []);
            }
        }
    }

    private getScope(position: vscode.Position): Scope | undefined {
        for (let i = position.line; i < this.lines.length; i++) {
            const scope = this.lines[i].getScope(position);

            if (scope) {
                return scope;
            }
        }
    }

    private updateLowestLineNumber(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        for (const contentChange of contentChanges) {
            this.lineToUpdateWhenTimeoutEnds =
                Math.min(this.lineToUpdateWhenTimeoutEnds, contentChange.range.start.line);
        }
    }

    private updateDecorations() {
        // One document may be shared by multiple editors (side by side view)
        const editors: vscode.TextEditor[] =
            vscode.window.visibleTextEditors.filter((e) => this.document === e.document);

        if (editors.length === 0) {
            console.warn("No editors associated with document: " + this.document.fileName);
            return;
        }

        const lineNumber = this.lineToUpdateWhenTimeoutEnds;

        const amountToRemove = this.lines.length - lineNumber;

        // Remove cached lines that need to be updated
        this.lines.splice(lineNumber, amountToRemove);

        const text = this.document.getText();
        const regex = new RegExp(this.settings.regexPattern, "g");

        regex.lastIndex = this.document.offsetAt(new vscode.Position(lineNumber, 0));

        let match: RegExpExecArray | null;
        // tslint:disable-next-line:no-conditional-assignment
        while ((match = regex.exec(text)) !== null) {
            const startPos = this.document.positionAt(match.index);

            const endPos = startPos.translate(0, match[0].length);

            const currentLine = this.getLine(startPos.line, this.document);
            currentLine.addBracket(match[0], startPos.character);
        }

        this.colorDecorations(editors);
    }

    private colorDecorations(editors: vscode.TextEditor[]) {
        const colorMap = new Map<string, vscode.Range[]>();

        // Reduce all the colors/ranges of the lines into a singular map
        for (const line of this.lines) {
            {
                for (const [color, ranges] of line.colorRanges) {
                    const existingRanges = colorMap.get(color);

                    if (existingRanges !== undefined) {
                        existingRanges.push(...ranges);
                    }
                    else {
                        // Slice because we will be adding values to this array in the future,
                        // but don't want to modify the original array which is stored per line
                        colorMap.set(color, ranges.slice());
                    }
                }
            }
        }

        for (const [color, decoration] of this.settings.bracketDecorations) {
            if (color === "") {
                continue;
            }
            const ranges = colorMap.get(color);
            editors.forEach((editor) => {
                if (ranges !== undefined) {
                    editor.setDecorations(decoration, ranges);
                }
                else {
                    // We must set non-used colors to an empty array
                    // or previous decorations will not be invalidated
                    editor.setDecorations(decoration, []);
                }
            });
        }

        this.lineToUpdateWhenTimeoutEnds = Infinity;
    }
}
