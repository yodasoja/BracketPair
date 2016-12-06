'use strict';
import * as vscode from 'vscode';
import TextLine from "./textLine";
import Settings from "./settings";

export default class Document {
    private timeout: NodeJS.Timer | null;
    // This program caches non-changes lines, and will only analyze linenumbers including & above a changed line
    private lineToUpdateWhenTimeoutEnds = Infinity;

    private lines: TextLine[] = [];
    private readonly uri: string;
    private readonly settings: Settings;

    constructor(uri: string, settings: Settings) {
        this.settings = settings;
        this.uri = uri;
    }

    onDidChangeTextDocument(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.triggerUpdateDecorations(this.getLowestLineNumberChanged(contentChanges));
    }

    private getLowestLineNumberChanged(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        let lowestLineNumberChanged = Infinity;

        for (let contentChange of contentChanges) {
            lowestLineNumberChanged = Math.min(lowestLineNumberChanged, contentChange.range.start.line);
        }

        return lowestLineNumberChanged;
    }

    // Lines are stored in an array, if line is requested outside of array bounds
    // add emptys lines until array is correctly sized
    private getLine(index: number): TextLine {
        if (index < this.lines.length) {
            return this.lines[index];
        }
        else {
            for (let i = this.lines.length; i <= index; i++) {
                let newLine = new TextLine(this.settings, this.lines[i - 1]);
                this.lines.push(newLine);
            }
            let lineToReturn = this.lines[this.lines.length - 1];
            return lineToReturn;
        }
    }

    triggerUpdateDecorations(lineNumber: number = 0) {
        if (this.settings.timeOutLength > 0) {
            // Have to keep a reference to this or everything breaks
            let self = this;

            if (this.timeout) {
                clearTimeout(this.timeout);
            }

            this.lineToUpdateWhenTimeoutEnds = Math.min(this.lineToUpdateWhenTimeoutEnds, lineNumber);
            this.timeout = setTimeout(function () {
                self.updateDecorations();
                self.lineToUpdateWhenTimeoutEnds = Infinity;
            }, this.settings.timeOutLength);
        }
        else {
            this.updateDecorations(lineNumber);
        }
    }

    private updateDecorations(lineNumber?: number) {
        let editors: vscode.TextEditor[] = [];

        // One document may be shared by multiple editors (side by side view)
        vscode.window.visibleTextEditors.forEach(editor => {
            if (editor.document && this.uri === editor.document.uri.toString()) {
                editors.push(editor);
            }
        });

        if (editors.length === 0) {
            return;
        }

        let document = editors[0].document;

        if (lineNumber === undefined) {
            lineNumber = this.lineToUpdateWhenTimeoutEnds;
        }

        let amountToRemove = this.lines.length - lineNumber;

        // Remove cached lines that need to be updated
        this.lines.splice(lineNumber, amountToRemove);

        let text = document.getText();
        let regex = new RegExp(this.settings.regexPattern, "g");
        regex.lastIndex = document.offsetAt(new vscode.Position(lineNumber, 0));

        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            let startPos = document.positionAt(match.index);

            let endPos = startPos.translate(0, match[0].length);
            let range = new vscode.Range(startPos, endPos);

            let currentLine = this.getLine(startPos.line);
            currentLine.addBracket(match[0], range);
        }

        let colorMap = new Map<string, vscode.Range[]>();

        // Reduce all the colors/ranges of the lines into a singular map
        for (let line of this.lines) {
            {
                for (let [color, ranges] of line.colorRanges) {
                    let existingRanges = colorMap.get(color);

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

        for (let [color, decoration] of this.settings.decorations) {
            let ranges = colorMap.get(color);
            editors.forEach(editor => {
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