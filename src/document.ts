'use strict';
import * as vscode from 'vscode';
import BracketPair from "./bracketPair";
type LineDecoration = Map<vscode.TextEditorDecorationType, vscode.Range[]>;

export default class Document {
    private lineDecorations: LineDecoration[] = [];
    private textEditor: vscode.TextEditor;

    private readonly infinitePosition: vscode.Position;
    private readonly bracketPairs: BracketPair[];
    private readonly regexPattern: string;
    private referenceDocument: string;

    constructor(textEditor: vscode.TextEditor) {
        // TODO Move this to settings
        let roundBracket = new BracketPair('(', ')', ["#CCC42C", "#99976E", "#FFD351", "#90C2FF", "#2C9ECC"]);
        let squareBracket = new BracketPair('[', ']', ["#CCC42C", "#99976E", "#FFD351", "#90C2FF", "#2C9ECC"]);
        let curlyBracket = new BracketPair('{', '}', ["#CCC42C", "#99976E", "#FFD351", "#90C2FF", "#2C9ECC"]);


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

    getLineDecoration(index: number) {
        if (index < this.lineDecorations.length) {
            return this.lineDecorations[index];
        }
        else {
            if (this.lineDecorations.length === 0) {
                this.lineDecorations.push(this.getEmptyLine());
            }

            for (let i = this.lineDecorations.length - 1; i < index; i++) {
                this.lineDecorations.push(this.getEmptyLine());
            }
            return (this.lineDecorations[this.lineDecorations.length - 1]);
        }

    }

    getEmptyLine() {
        let line = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();

        for (let bracketPair of this.bracketPairs) {
            for (let decoration of bracketPair.colorDeclaration) {
                line.set(decoration, []);
            }
        }

        return line;
    }

    updateDecorations(lineNumber: number = 0) {
        let amountToRemove = this.lineDecorations.length - lineNumber;
        this.lineDecorations.splice(lineNumber, amountToRemove);

        console.log(this.textEditor.document.fileName);
        console.log("Colorizing brackets from line: " + (lineNumber + 1));

        // TODO Move errorBracket to brackets array and count amount of unmatched brackets
        let errorBracket: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
            color: "#e2041b"
        });

        let text = this.textEditor.document.getText(new vscode.Range(new vscode.Position(lineNumber, 0), this.infinitePosition));

        let bracketCount: { [character: string]: number; } = {};

        for (let bracketPair of this.bracketPairs) {
            bracketCount[bracketPair.openCharacter] = 0;
            bracketCount[bracketPair.closeCharacter] = 0;
        }

        //let decorations = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();

        let regex = new RegExp(this.regexPattern, "g");

        let match: RegExpExecArray | null;
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

                    let decoration = this.getLineDecoration(startPos.line).get(colorDeclaration);
                    if (decoration !== undefined) {
                        decoration.push(range);
                    }
                    else {
                        this.lineDecorations[startPos.line].set(colorDeclaration, [range]);
                    }
                    bracketCount[bracketPair.openCharacter]++;
                    break;
                }
                else if (bracketPair.closeCharacter === match[0]) {
                    // If no more open brackets, bracket is an 'error'
                    if (bracketCount[bracketPair.openCharacter] === 0) {
                        let decoration = this.getLineDecoration(startPos.line).get(errorBracket);
                        if (decoration !== undefined) {
                            decoration.push(range);
                        }
                        else {
                            this.lineDecorations[startPos.line].set(errorBracket, [range]);
                        }

                        bracketCount[bracketPair.closeCharacter]++;
                    }
                    // If close bracket matches, decrement open count
                    else {
                        bracketCount[bracketPair.openCharacter]--;

                        let colorIndex = bracketCount[bracketPair.openCharacter] % bracketPair.colorDeclaration.length;
                        let colorDeclaration = bracketPair.colorDeclaration[colorIndex];

                        let decoration = this.getLineDecoration(startPos.line).get(colorDeclaration);
                        if (decoration !== undefined) {
                            decoration.push(range);
                        }
                        else {
                            this.lineDecorations[startPos.line].set(colorDeclaration, [range]);
                        }
                    }
                    break;
                }
            }
        }

        console.time('decorations');

        console.log("Amount of lines: " + this.lineDecorations.length);

        for (let map of this.lineDecorations) {
            {
                for (let [decoration, ranges] of map) {
                    this.textEditor.setDecorations(decoration, ranges);
                }
            }
        }
        console.timeEnd('decorations');

    }
}