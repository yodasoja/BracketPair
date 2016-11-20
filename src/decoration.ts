'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export default class Decoration {
    range: vscode.Range;
    declaration: vscode.TextEditorDecorationType;

    constructor(range: vscode.Range, declaration: vscode.TextEditorDecorationType) {
        this.range = range;
        this.declaration = declaration;
    }
}