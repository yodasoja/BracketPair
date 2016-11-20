'use strict';
import * as vscode from 'vscode';
import BracketPair from "./bracketPair";

export default class Document {
    bracketsPerLine: { [character: string]: number; }[] = [];
    textEditor: vscode.TextEditor;

    readonly infinitePosition: vscode.Position;
    readonly bracketPairs: BracketPair[];
    readonly regexPattern: string;

    constructor(textEditor: vscode.TextEditor) {
        // TODO Move this to settings
        let roundBracket = new BracketPair('(', ')', ["#e6b422", "#c70067", "#00a960", "#fc7482"]);
        let squareBracket = new BracketPair('[', ']', ["#33ccff", "#8080ff", "#0073a8"]);
        let curlyBracket = new BracketPair('{', '}', ["#d4d4aa", "#d1a075", "#9c6628"]);

        this.infinitePosition = new vscode.Position(Infinity, Infinity);
        this.bracketPairs = [roundBracket, squareBracket, curlyBracket];
        this.textEditor = textEditor;

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
        let highestLineNumberChanged = 0;

        for (let contentChange of contentChanges) {
            if (this.updateRequired(contentChange)) {
                lowestLineNumberChanged = Math.min(lowestLineNumberChanged, contentChange.range.start.line);
                highestLineNumberChanged = Math.max(highestLineNumberChanged, contentChange.range.end.line);
            }
        }

        this.updateDecorations(lowestLineNumberChanged);
    }

    updateRequired(contentChange: vscode.TextDocumentContentChangeEvent) {
        let regex = new RegExp(this.regexPattern);
        let splitContent = contentChange.text.split("\r\n");
        if (splitContent.length > 1) {
            let amountOfNewLines = splitContent.length - 1;
            let emptyBrackets: { [character: string]: number; }[] = [];

            for (let i = 0; i <= amountOfNewLines; i++) {
                emptyBrackets.push(this.getEmptyBracketArray());
            }

            console.log("Inserting " + amountOfNewLines + " line(s) after line: " + (contentChange.range.start.line + 1));
            this.bracketsPerLine =
                this.bracketsPerLine.slice(0, contentChange.range.start.line)
                    .concat(emptyBrackets)
                    .concat(this.bracketsPerLine
                        .slice(contentChange.range.start.line));

            // lowestLineNumberChanged = Math.min(lowestLineNumberChanged, contentChange.range.start.line);
            // highestLineNumberChanged = Math.max(highestLineNumberChanged, contentChange.range.start.line + amountOfNewLines);

        } // Line(s) deleted
        else if (contentChange.text === "" && contentChange.range.start.line !== contentChange.range.end.line) {
            console.log("Removing lines between: " + (contentChange.range.start.line + 1) + ", " + (contentChange.range.end.line + 1));
            let linesToBeRemoved = contentChange.range.end.line - contentChange.range.start.line;
            this.bracketsPerLine.splice(contentChange.range.start.line, linesToBeRemoved);
        }
        // Text deleted
        else if (contentChange.text === "") {
            console.log("Text deleted at line : " + (contentChange.range.start.line + 1));
        }
        // Text contains a bracket
        else if (regex.test(contentChange.text)) {
            console.log("Text added at line : " + (contentChange.range.start.line + 1));
        }
        // No need to update
        else {
            return false;
        }

        return true;
    }

    updateDecorations(lineNumber: number = 0) {

        console.log("Colorizing brackets from line: " + (lineNumber + 1));

        // TODO Move errorBracket to brackets array and count amount of unmatched brackets
        let errorBracket: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
            color: "#e2041b"
        });

        let text: string;

        if (lineNumber !== 0) {
            text = this.textEditor.document.getText(new vscode.Range(new vscode.Position(lineNumber, 0), this.infinitePosition));
        }
        else {
            text = this.textEditor.document.getText();
        }

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