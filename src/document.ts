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
                let bracketCount: { [character: string]: number; } = {};
                this.bracketPairs.forEach(bracketPair => {
                    bracketCount[bracketPair.openCharacter] = 0;
                    bracketCount[bracketPair.closeCharacter] = 0;
                });

                this.bracketsPerLine.push(bracketCount);
            }
        }
    }

    onDidChangeTextDocument(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        let regex = new RegExp(this.regexPattern);
        for (let contentChange of contentChanges) {
            // TODO Implement virtual document tracking to detect deleted text
            // TODO Per line record amount of brackets for optimization, no need to parse whole document per change
            if (contentChange.text === "" || regex.test(contentChange.text)) {
                this.updateDecorations(contentChange.range.start.line);
                return;
            }
        }
    }

    updateDecorations(lineNumber = 0) {
        console.log("Colorizing brackets");

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

        let bracketCount: { [character: string]: number; } = {};
        let decorations = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();

        for (let bracketPair of this.bracketPairs) {
            bracketCount[bracketPair.openCharacter] = 0;
            bracketCount[bracketPair.closeCharacter] = 0;
        }

        let regex = new RegExp(this.regexPattern, "g");

        let match: RegExpExecArray | null;
        let previousLineNumber = -1;
        while ((match = regex.exec(text)) !== null) {
            let startPos = new vscode.Position(this.textEditor.document.positionAt(match.index).line + lineNumber, this.textEditor.document.positionAt(match.index).character);
            let endPos = startPos.translate(0, match[0].length);
            let range = new vscode.Range(startPos, endPos);

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