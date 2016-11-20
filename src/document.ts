'use strict';
import * as vscode from 'vscode';
import BracketPair from "./bracketPair";

export default class Document {
    bracketPairs: BracketPair[];
    bracketsPerLine: BracketPair[][];
    textEditor: vscode.TextEditor;
    readonly infinitePosition: vscode.Position;
    regexPattern: string;

    constructor(textEditor: vscode.TextEditor) {
        // TODO Move this to settings
        let roundBracket = new BracketPair('(', ')', ["#e6b422", "#c70067", "#00a960", "#fc7482"]);
        let squareBracket = new BracketPair('[', ']', ["#33ccff", "#8080ff", "#0073a8"]);
        let curlyBracket = new BracketPair('{', '}', ["#d4d4aa", "#d1a075", "#9c6628"]);

        this.infinitePosition = new vscode.Position(Infinity, Infinity);
        this.bracketPairs = [roundBracket, squareBracket, curlyBracket];
        this.textEditor = textEditor;

        this.regexPattern = "[";
        for (let bracketPair of this.bracketPairs) {
            this.regexPattern += "\\" + bracketPair.openCharacter + "\\" + bracketPair.closeCharacter;

        }
        this.regexPattern += "]";
    }

    onDidChangeTextDocument(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        let regex = new RegExp(this.regexPattern);
        for (let contentChange of contentChanges) {
            // TODO Implement virtual document tracking to detect deleted text
            // TODO Per line record amount of brackets for optimization, no need to parse whole document per change
            if (contentChange.text === "" || regex.test(contentChange.text)) {
                this.updateDecorations();
                return;
            }
        }
    }

    updateDecorations(startPosition: vscode.Position | null = null) {
        console.log("Colorizing brackets");

        // TODO Move errorBracket to brackets array and count amount of unmatched brackets
        let errorBracket: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
            color: "#e2041b"
        });

        let text: string;

        if (startPosition !== null) {
            text = this.textEditor.document.getText(new vscode.Range(startPosition, this.infinitePosition));
        }
        else {
            text = this.textEditor.document.getText();
        }

        let bracketCount: { [character: string]: number; } = {};

        let decorations = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();

        for (let bracketPair of this.bracketPairs) {
            bracketCount[bracketPair.openCharacter] = 0;
        }

        let regex = new RegExp(this.regexPattern, "g");

        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            let startPos = this.textEditor.document.positionAt(match.index);
            let endPos = this.textEditor.document.positionAt(match.index + match[0].length);
            let range = new vscode.Range(startPos, endPos);

            for (let bracketPair of this.bracketPairs) {
                // If char matches, store the position and color 
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
                    if (bracketCount[bracketPair.openCharacter] === 0) {
                        let decoration = decorations.get(errorBracket);
                        if (decoration !== undefined) {
                            decoration.push(range);
                        }
                        else {
                            decorations.set(errorBracket, [range]);
                        }
                    }
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
        }

        for (let [decoration, ranges] of decorations.entries()) {
            this.textEditor.setDecorations(decoration, ranges);
        }
    }
}