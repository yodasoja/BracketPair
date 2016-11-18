'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

class BracketPair {
    openCharacter: string;
    closeCharacter: string;
    colorDeclaration: vscode.TextEditorDecorationType[] = [];

    constructor(colors: string[], firstBracket: string, lastBracket: string) {
        this.openCharacter = firstBracket;
        this.closeCharacter = lastBracket;

        for (let color of colors) {
            this.colorDeclaration.push(vscode.window.createTextEditorDecorationType({
                color: color
            }));
        }
    }
}

class Decoration {
    range: vscode.Range;
    declaration: vscode.TextEditorDecorationType;

    constructor(range: vscode.Range, declaration: vscode.TextEditorDecorationType) {
        this.range = range;
        this.declaration = declaration;
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log("Activated");
    let timeout: NodeJS.Timer | null = null;
    let roundBracket = new BracketPair(["#e6b422", "#c70067", "#00a960", "#fc7482"], '(', ')');
    let squareBracket = new BracketPair(["#33ccff", "#8080ff", "#0073a8"], '[', ']');
    let curlyBracket = new BracketPair(["#d4d4aa", "#d1a075", "#9c6628"], '{', '}');

    let bracketPairs: BracketPair[] = [roundBracket, squareBracket, curlyBracket];

    let errorBracket: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
        color: "#e2041b"
    });

    let regexPattern: string = "[";

    for (let bracketPair of bracketPairs) {
        regexPattern += "\\" + bracketPair.openCharacter + "\\" + bracketPair.closeCharacter;

    }

    regexPattern += "]";

    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    // TODO If remove text feature is added, update this method
    // Watching: https://github.com/Microsoft/vscode/issues/6374
    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            let regex = new RegExp(regexPattern);
            for (let contentChange of event.contentChanges) {
                if (contentChange.text === "" || regex.test(contentChange.text)) {
                    triggerUpdateDecorations();
                    return;
                }
            }
        }
    }, null, context.subscriptions);

    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 500);
    }

    function updateDecorations() {
        console.log("Colorizing brackets");

        let text = activeEditor.document.getText();
        console.log(text);
        let openBrackets: { [character: string]: number; } = {};

        let decorations = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();

        for (let bracketPair of bracketPairs) {
            openBrackets[bracketPair.openCharacter] = 0;
        }

        let regex = new RegExp(regexPattern, "g");

        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            let startPos = activeEditor.document.positionAt(match.index);
            let endPos = activeEditor.document.positionAt(match.index + match[0].length);
            let range = new vscode.Range(startPos, endPos);

            for (let bracketPair of bracketPairs) {
                // If char matches, store the position and color 
                if (bracketPair.openCharacter === match[0]) {
                    let colorIndex = openBrackets[bracketPair.openCharacter] % bracketPair.colorDeclaration.length;
                    let colorDeclaration = bracketPair.colorDeclaration[colorIndex];

                    let decoration = decorations.get(colorDeclaration);
                    if (decoration !== undefined) {
                        decoration.push(range);
                    }
                    else {
                        decorations.set(colorDeclaration, [range]);
                    }
                    openBrackets[bracketPair.openCharacter]++;
                    break;
                }
                else if (bracketPair.closeCharacter === match[0]) {
                    if (openBrackets[bracketPair.openCharacter] === 0) {
                        let decoration = decorations.get(errorBracket);
                        if (decoration !== undefined) {
                            decoration.push(range);
                        }
                        else {
                            decorations.set(errorBracket, [range]);
                        }
                    }
                    else {
                        openBrackets[bracketPair.openCharacter]--;

                        let colorIndex = openBrackets[bracketPair.openCharacter] % bracketPair.colorDeclaration.length;
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
            activeEditor.setDecorations(decoration, ranges);
        }
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}