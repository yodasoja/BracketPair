'use strict';
import * as vscode from 'vscode';
import BracketPair from "./bracketPair";
type LineColorMap = Map<string, vscode.Range[]>;

export default class Document {
    private lineDecorations: LineColorMap[] = [];
    private textEditor: vscode.TextEditor;
    private decorations = new Map<string, vscode.TextEditorDecorationType>();

    private readonly infinitePosition: vscode.Position;
    private readonly bracketPairs: BracketPair[];
    private readonly regexPattern: string;
    private referenceDocument: string;

    constructor(textEditor: vscode.TextEditor) {
        // TODO Move this to settings
        let roundBracket = new BracketPair('(', ')', ["#CCC42C", "#99976E", "#FFD351", "#90C2FF", "#2C9ECC"], "#e2041b");
        let squareBracket = new BracketPair('[', ']', ["#CCC42C", "#99976E", "#FFD351", "#90C2FF", "#2C9ECC"], "#e2041b");
        let curlyBracket = new BracketPair('{', '}', ["#CCC42C", "#99976E", "#FFD351", "#90C2FF", "#2C9ECC"], "#e2041b");

        this.infinitePosition = new vscode.Position(Infinity, Infinity);
        this.bracketPairs = [roundBracket, squareBracket, curlyBracket];
        this.textEditor = textEditor;
        this.referenceDocument = textEditor.document.getText();

        let regexBuilder = "[";
        this.bracketPairs.forEach(bracketPair => {
            regexBuilder += `\\${bracketPair.openCharacter}\\${bracketPair.closeCharacter}`;

            bracketPair.colors.forEach(color => {
                this.decorations.set(color, vscode.window.createTextEditorDecorationType({
                    color: color
                }));
            });
            this.decorations.set(bracketPair.orphanColor, vscode.window.createTextEditorDecorationType({
                color: bracketPair.orphanColor
            }));
        });

        regexBuilder += "]";

        this.regexPattern = regexBuilder;
    }

    onDidChangeTextDocument(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        let lowestLineNumberChanged = this.textEditor.document.lineCount - 1;

        for (let contentChange of contentChanges) {
            if (this.updateRequired(contentChange)) {
                lowestLineNumberChanged = Math.min(lowestLineNumberChanged, contentChange.range.start.line);
            }
        }

        this.updateDecorations(lowestLineNumberChanged);
    }

    updateRequired(contentChange: vscode.TextDocumentContentChangeEvent) {
        let regex = new RegExp(this.regexPattern);

        let editStart = this.textEditor.document.offsetAt(contentChange.range.start);
        let editEnd = editStart + contentChange.rangeLength;

        let startText = this.referenceDocument.substring(0, editStart);
        let removedText = this.referenceDocument.substring(editStart, editEnd);
        let endText = this.referenceDocument.substring(editEnd);

        this.referenceDocument = startText + contentChange.text + endText;

        return (regex.test(removedText) || regex.test(contentChange.text));
    }

    getLineColorMap(index: number): LineColorMap {
        if (index < this.lineDecorations.length) {
            return this.lineDecorations[index];
        }
        else {
            for (let i = this.lineDecorations.length; i <= index; i++) {
                this.lineDecorations.push(new Map<string, vscode.Range[]>());
            }
            return (this.lineDecorations[this.lineDecorations.length - 1]);
        }
    }

    updateDecorations(lineNumber: number = 0) {
        console.time("updateDecorations");

        let amountToRemove = this.lineDecorations.length - lineNumber;
        this.lineDecorations.splice(lineNumber, amountToRemove);
        let startPos = new vscode.Position(lineNumber, 0);
        let text = this.textEditor.document.getText(new vscode.Range(startPos, new vscode.Position(Infinity, Infinity)));
        let startIndex = this.textEditor.document.offsetAt(startPos);
        let bracketCount: { [character: string]: number; } = {};

        for (let bracketPair of this.bracketPairs) {
            bracketCount[bracketPair.openCharacter] = 0;
            bracketCount[bracketPair.closeCharacter] = 0;
        }

        let regex = new RegExp(this.regexPattern, "g");

        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            let textPos = this.textEditor.document.positionAt(this.textEditor.document.offsetAt(this.textEditor.document.positionAt(match.index)) + startIndex);

            let startPos = new vscode.Position(textPos.line, textPos.character);
            let endPos = startPos.translate(0, match[0].length);
            let range = new vscode.Range(startPos, endPos);

            for (let bracketPair of this.bracketPairs) {
                // If open bracket matches, store the position and color, increment count 
                if (bracketPair.openCharacter === match[0]) {
                    let colorIndex = bracketCount[bracketPair.openCharacter] % bracketPair.colors.length;
                    let color = bracketPair.colors[colorIndex];

                    let colorRanges = this.getLineColorMap(startPos.line).get(color);
                    if (colorRanges !== undefined) {
                        colorRanges.push(range);
                    }
                    else {
                        this.lineDecorations[startPos.line].set(color, [range]);
                    }
                    bracketCount[bracketPair.openCharacter]++;
                    break;
                }
                else if (bracketPair.closeCharacter === match[0]) {
                    // If close bracket matches, decrement open count
                    if (bracketCount[bracketPair.openCharacter] !== 0) {
                        bracketCount[bracketPair.openCharacter]--;

                        let colorIndex = bracketCount[bracketPair.openCharacter] % bracketPair.colors.length;
                        let colorDeclaration = bracketPair.colors[colorIndex];

                        let colorRanges = this.getLineColorMap(startPos.line).get(colorDeclaration);
                        if (colorRanges !== undefined) {
                            colorRanges.push(range);
                        }
                        else {
                            this.lineDecorations[startPos.line].set(colorDeclaration, [range]);
                        }
                    }
                    // If no more open brackets, bracket is an 'error'
                    else {
                        let colorRanges = this.getLineColorMap(startPos.line).get(bracketPair.orphanColor);
                        if (colorRanges !== undefined) {
                            colorRanges.push(range);
                        }
                        else {
                            this.lineDecorations[startPos.line].set(bracketPair.orphanColor, [range]);
                        }

                        bracketCount[bracketPair.closeCharacter]++;
                    }
                }
                break;
            }
        }

        let reduceMap = new Map<string, vscode.Range[]>();
        for (let map of this.lineDecorations) {
            {
                for (let [color, ranges] of map) {
                    let existingRanges = reduceMap.get(color);

                    if (existingRanges !== undefined) {
                        existingRanges.push.apply(existingRanges, ranges);
                    }
                    else {
                        // Slice because we will be added values to this array in the future, 
                        // but don't want to modify the original array which is stored per line
                        reduceMap.set(color, ranges.slice());
                    }
                }
            }
        }

        let sum = 0;
        for (let [color, decoration] of this.decorations) {
            let ranges = reduceMap.get(color);
            if (ranges !== undefined) {
                sum += ranges.length;
                this.textEditor.setDecorations(decoration, ranges);
            }
            else {
                this.textEditor.setDecorations(decoration, []);
            }
        }

        console.timeEnd("updateDecorations");
        console.log(sum + " decorations");
    }
}