'use strict';
import * as vscode from 'vscode';
import BracketPair from "./bracketPair";
import TextLine from "./textLine";

export default class Document {
    private timeout: NodeJS.Timer | null;
    private readonly timeOutLength: number;
    // This program caches non-changes lines, and will only analyze linenumbers including & above a changed line
    private lineToUpdateWhenTimeoutEnds = Infinity;

    private lines: TextLine[] = [];
    private readonly uri: string;
    private decorations = new Map<string, vscode.TextEditorDecorationType>();

    private readonly bracketPairs: BracketPair[];
    private readonly regexPattern: string;

    constructor(uri: string, bracketPairs: BracketPair[], timeOut: number) {

        this.bracketPairs = bracketPairs;
        this.uri = uri;
        this.timeOutLength = timeOut;
        this.regexPattern = this.createRegex(this.bracketPairs);
    }

    // Create a regex to match open and close brackets
    // TODO Test what happens if user specifies other characters then []{}()
    private createRegex(bracketPairs: BracketPair[]) {
        let regex = "[";

        for (let bracketPair of bracketPairs) {
            regex += `\\${bracketPair.openCharacter}\\${bracketPair.closeCharacter}`;

            for (let color of bracketPair.colors) {
                let decoration = vscode.window.createTextEditorDecorationType({ color: color });
                this.decorations.set(color, decoration);
            }

            let errorDecoration = vscode.window.createTextEditorDecorationType({ color: bracketPair.orphanColor });
            this.decorations.set(bracketPair.orphanColor, errorDecoration);
        }

        regex += "]";

        return regex;
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
                let newLine = new TextLine(this.bracketPairs, this.lines[i - 1]);
                this.lines.push(newLine);
            }
            let lineToReturn = this.lines[this.lines.length - 1];
            return lineToReturn;
        }
    }

    triggerUpdateDecorations(lineNumber: number = 0) {
        if (this.timeOutLength > 0) {
            // Have to keep a reference to this or everything breaks
            let self = this;

            if (this.timeout) {
                clearTimeout(this.timeout);
            }

            this.lineToUpdateWhenTimeoutEnds = Math.min(this.lineToUpdateWhenTimeoutEnds, lineNumber);
            this.timeout = setTimeout(function () {
                self.updateDecorations();
                self.lineToUpdateWhenTimeoutEnds = Infinity;
            }, this.timeOutLength);
        }
        else {
            this.updateDecorations(lineNumber);
        }
    }

    private updateDecorations(lineNumber?: number) {
        vscode.window.visibleTextEditors.forEach(editor => {
            if (editor.document && this.uri === editor.document.uri.toString()) {

                if (lineNumber === undefined) {
                    lineNumber = this.lineToUpdateWhenTimeoutEnds;
                }

                let amountToRemove = this.lines.length - lineNumber;

                // Remove cached lines that need to be updated
                this.lines.splice(lineNumber, amountToRemove);

                let text = editor.document.getText();
                let regex = new RegExp(this.regexPattern, "g");
                regex.lastIndex = editor.document.offsetAt(new vscode.Position(lineNumber, 0));

                let match: RegExpExecArray | null;
                while ((match = regex.exec(text)) !== null) {
                    let startPos = editor.document.positionAt(match.index);

                    let endPos = startPos.translate(0, match[0].length);
                    let range = new vscode.Range(startPos, endPos);

                    let currentLine = this.getLine(startPos.line);

                    for (let bracketPair of this.bracketPairs) {
                        // If open bracket matches
                        if (bracketPair.openCharacter === match[0]) {
                            let colorIndex = currentLine.bracketCount[bracketPair.openCharacter] % bracketPair.colors.length;
                            let color = bracketPair.colors[colorIndex];

                            let colorRanges = currentLine.colorRanges.get(color);
                            if (colorRanges !== undefined) {
                                colorRanges.push(range);
                            }
                            else {
                                currentLine.colorRanges.set(color, [range]);
                            }
                            currentLine.bracketCount[bracketPair.openCharacter]++;
                            break;
                        }
                        else if (bracketPair.closeCharacter === match[0]) {
                            // If close bracket matches
                            if (currentLine.bracketCount[bracketPair.openCharacter] !== 0) {
                                currentLine.bracketCount[bracketPair.openCharacter]--;

                                let colorIndex = currentLine.bracketCount[bracketPair.openCharacter] % bracketPair.colors.length;
                                let colorDeclaration = bracketPair.colors[colorIndex];

                                let colorRanges = currentLine.colorRanges.get(colorDeclaration);
                                if (colorRanges !== undefined) {
                                    colorRanges.push(range);
                                }
                                else {
                                    currentLine.colorRanges.set(colorDeclaration, [range]);
                                }
                            }
                            // If no more open brackets, close bracket is an 'orphan'
                            else {
                                let colorRanges = currentLine.colorRanges.get(bracketPair.orphanColor);
                                if (colorRanges !== undefined) {
                                    colorRanges.push(range);
                                }
                                else {
                                    currentLine.colorRanges.set(bracketPair.orphanColor, [range]);
                                }

                                // We can count orphaned brackets, but no use-case for it yet
                                // currentLine.bracketCount[bracketPair.closeCharacter]++;
                            }
                            break;
                        }
                    }
                }

                let colorMap = new Map<string, vscode.Range[]>();

                // Reduce all the colors/ranges of the lines into a singular map
                for (let line of this.lines) {
                    {
                        for (let [color, ranges] of line.colorRanges) {
                            let existingRanges = colorMap.get(color);

                            if (existingRanges !== undefined) {
                                existingRanges.push.apply(existingRanges, ranges);
                            }
                            else {
                                // Slice because we will be adding values to this array in the future, 
                                // but don't want to modify the original array which is stored per line
                                colorMap.set(color, ranges.slice());
                            }
                        }
                    }
                }

                for (let [color, decoration] of this.decorations) {
                    let ranges = colorMap.get(color);
                    if (ranges !== undefined) {
                        editor.setDecorations(decoration, ranges);
                    }
                    else {
                        // We must set non-used colors to an empty array
                        // Or previous decorations will not be invalidated
                        editor.setDecorations(decoration, []);
                    }
                }
                return;
            }
        });
    }
}