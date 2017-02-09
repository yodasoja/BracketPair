import * as vscode from "vscode";
import Settings from "./settings";
import TextLine from "./textLine";

export default class DocumentDecoration {
    private updateDecorationTimeout: NodeJS.Timer | null;
    // This program caches non-changes lines, and will only analyze linenumbers including & above a changed line
    private lineToUpdateWhenTimeoutEnds = Infinity;
    private lines: TextLine[] = [];
    private readonly uri: string;
    private readonly settings: Settings;

    constructor(uri: string, settings: Settings) {
        this.settings = settings;
        this.uri = uri;
    }

    public onDidChangeTextDocument(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.triggerUpdateDecorations(this.getLowestLineNumberChanged(contentChanges));
    }

    // Lines are stored in an array, if line is requested outside of array bounds
    // add emptys lines until array is correctly sized
    public getLine(index: number): TextLine {
        if (index < this.lines.length) {
            return this.lines[index];
        }
        else {
            if (this.lines.length === 0) {
                this.lines.push(new TextLine(this.settings));
            }

            for (let i = this.lines.length; i <= index; i++) {
                const previousLine = this.lines[this.lines.length - 1];
                const newLine = previousLine.clone();

                this.lines.push(newLine);
            }

            const lineToReturn = this.lines[this.lines.length - 1];
            return lineToReturn;
        }
    }

    public triggerUpdateDecorations(lineNumber: number = 0) {
        if (this.settings.timeOutLength > 0) {
            // Have to keep a reference to this or everything breaks

            if (this.updateDecorationTimeout) {
                clearTimeout(this.updateDecorationTimeout);
            }

            this.lineToUpdateWhenTimeoutEnds = Math.min(this.lineToUpdateWhenTimeoutEnds, lineNumber);
            this.updateDecorationTimeout = setTimeout(() => {
                this.updateDecorations();
                this.lineToUpdateWhenTimeoutEnds = Infinity;
            }, this.settings.timeOutLength);
        }
        else {
            this.updateDecorations(lineNumber);
        }
    }

    private getLowestLineNumberChanged(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        let lowestLineNumberChanged = Infinity;

        for (const contentChange of contentChanges) {
            lowestLineNumberChanged = Math.min(lowestLineNumberChanged, contentChange.range.start.line);
        }

        return lowestLineNumberChanged;
    }

    private updateDecorations(lineNumber?: number) {
        const editors: vscode.TextEditor[] = [];

        // One document may be shared by multiple editors (side by side view)
        vscode.window.visibleTextEditors.forEach((editor) => {
            if (editor.document && this.uri === editor.document.uri.toString()) {
                editors.push(editor);
            }
        });

        if (editors.length === 0) {
            return;
        }

        // Only have to analyze the first document, since it is shared between the editors
        const document = editors[0].document;
        if (document.lineCount === 0) {
            // Sometimes document seems to be empty, just ignore until better solution found
            return;
        }

        if (lineNumber === undefined) {
            lineNumber = this.lineToUpdateWhenTimeoutEnds;
        }

        const amountToRemove = this.lines.length - lineNumber;

        // Remove cached lines that need to be updated
        this.lines.splice(lineNumber, amountToRemove);

        const text = document.getText();
        const regex = new RegExp(this.settings.regexPattern, "g");
        regex.lastIndex = document.offsetAt(new vscode.Position(lineNumber, 0));

        let match: RegExpExecArray | null;
        // tslint:disable-next-line:no-conditional-assignment
        while ((match = regex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);

            const endPos = startPos.translate(0, match[0].length);
            const range = new vscode.Range(startPos, endPos);

            const currentLine = this.getLine(startPos.line);
            currentLine.addBracket(match[0], range);
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

        for (const [color, decoration] of this.settings.decorations) {
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
    }
}
