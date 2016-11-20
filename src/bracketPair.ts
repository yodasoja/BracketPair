'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export default class BracketPair {
    
    readonly openCharacter: string;
    readonly closeCharacter: string;
    colorDeclaration: vscode.TextEditorDecorationType[] = [];

    constructor(firstBracket: string, lastBracket: string, colors: string[]) {
        this.openCharacter = firstBracket;
        this.closeCharacter = lastBracket;

        for (let color of colors) {
            this.colorDeclaration.push(vscode.window.createTextEditorDecorationType({
                color: color
            }));
        }
    }
}