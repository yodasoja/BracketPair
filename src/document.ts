'use strict';
import * as vscode from 'vscode';
import BracketPair from "./bracketPair";

export default class Document {
    bracketsPerLine: { [character: string]: number; }[] = [];
    textEditor: vscode.TextEditor;

    readonly infinitePosition: vscode.Position;
    readonly bracketPairs: BracketPair[];
    readonly regexPattern: string;
    referenceDocument: string;

    constructor(textEditor: vscode.TextEditor) {
        // TODO Move this to settings
        let roundBracket = new BracketPair('(', ')', ["#e6b422", "#c70067", "#00a960", "#fc7482"]);
        let squareBracket = new BracketPair('[', ']', ["#33ccff", "#8080ff", "#0073a8"]);
        let curlyBracket = new BracketPair('{', '}', ["#d4d4aa", "#d1a075", "#9c6628"]);

        this.infinitePosition = new vscode.Position(Infinity, Infinity);
        this.bracketPairs = [roundBracket, squareBracket, curlyBracket];
        this.textEditor = textEditor;
        this.referenceDocument = textEditor.document.getText();

        let regexBuilder = "[";
        this.bracketPairs.forEach(bracketPair => {
            regexBuilder += `\\${bracketPair.openCharacter}\\${bracketPair.closeCharacter}`;
        });
        regexBuilder += "]";

        this.regexPattern = regexBuilder;

        for (let i = 0; i < textEditor.document.lineCount; i++) {
            {
                this.bracketsPerLine.push(this.getEmptyBracketArray());
            }
        }
    }

    getEmptyBracketArray() {
        let bracketCount: { [character: string]: number; } = {};
        for (let bracketPair of this.bracketPairs) {
            bracketCount[bracketPair.openCharacter] = 0;
            bracketCount[bracketPair.closeCharacter] = 0;
        }

        return bracketCount;
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

        let addedLines = startText.split("\r\n").length - 1;
        let removedLines = contentChange.range.end.line - contentChange.range.start.line;

        if (addedLines > 0) {
            let emptyBrackets: { [character: string]: number; }[] = [];
            for (let i = 0; i <= addedLines; i++) {
                emptyBrackets.push(this.getEmptyBracketArray());
            }

            this.bracketsPerLine =
                this.bracketsPerLine.slice(0, contentChange.range.start.line)
                    .concat(emptyBrackets)
                    .concat(this.bracketsPerLine
                        .slice(contentChange.range.start.line));

        }

        if (removedLines > 0) {
            this.bracketsPerLine.splice(contentChange.range.start.line, removedLines);
        }

        return (regex.test(removedText) || regex.test(contentChange.text));
    }

    updateDecorations(lineNumber: number = 0) {

        console.log("Colorizing brackets from line: " + (lineNumber + 1));

        // TODO Move errorBracket to brackets array and count amount of unmatched brackets
        let errorBracket: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
            color: "#e2041b"
        });

        let text = this.textEditor.document.getText(new vscode.Range(new vscode.Position(lineNumber, 0), this.infinitePosition));

        let bracketCount = this.getEmptyBracketArray();
        let decorations = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();

        let regex = new RegExp(this.regexPattern, "g");

        let match: RegExpExecArray | null;
        let previousLineNumber = -1;
        while ((match = regex.exec(text)) !== null) {
            let textPos = this.textEditor.document.positionAt(match.index);
            let startPos = new vscode.Position(textPos.line + lineNumber, textPos.character);
            let endPos = startPos.translate(0, match[0].length);
            let range = new vscode.Range(startPos, endPos);

            //console.log("Found bracket at Line: " + (startPos.line + 1) + ", Character: " + startPos.character);

            for (let bracketPair of this.bracketPairs) {
                // If open bracket matches, store the position and color, increment count 
                if (bracketPair.openCharacter === match[0]) {
                    let colorIndex = bracketCount[bracketPair.openCharacter] % bracketPair.colorDeclaration.length;
                    let colorDeclaration = bracketPair.colorDeclaration[colorIndex];

                    let decoration = decorations.get(colorDeclaration);
                    if (decoration !== undefined) {
                        decoration.push(range);
                    }
                    else {
                        decorations.set(colorDeclaration, [range]);
                    }
                    bracketCount[bracketPair.openCharacter]++;
                    break;
                }
                else if (bracketPair.closeCharacter === match[0]) {
                    // If no more open brackets, bracket is an 'error'
                    if (bracketCount[bracketPair.openCharacter] === 0) {
                        let decoration = decorations.get(errorBracket);
                        if (decoration !== undefined) {
                            decoration.push(range);
                        }
                        else {
                            decorations.set(errorBracket, [range]);
                        }

                        bracketCount[bracketPair.closeCharacter]++;
                    }
                    // If close bracket matches, decrement open count
                    else {
                        bracketCount[bracketPair.openCharacter]--;

                        let colorIndex = bracketCount[bracketPair.openCharacter] % bracketPair.colorDeclaration.length;
                        let colorDeclaration = bracketPair.colorDeclaration[colorIndex];

                        let decoration = decorations.get(colorDeclaration);
                        if (decoration !== undefined) {
                            decoration.push(range);
                        }
                        else {
                            decorations.set(colorDeclaration, [range]);
                        }
                    }
                    break;
                }
            }

            if (startPos.line !== previousLineNumber) {
                this.bracketPairs.forEach(bracketPair => {
                    this.bracketsPerLine[startPos.line][bracketPair.openCharacter] = bracketCount[bracketPair.openCharacter];
                    this.bracketsPerLine[startPos.line][bracketPair.closeCharacter] = bracketCount[bracketPair.closeCharacter];
                });

                previousLineNumber = startPos.line;
            }
        }

        for (let [decoration, ranges] of decorations.entries()) {
            this.textEditor.setDecorations(decoration, ranges);
        }
    }
}