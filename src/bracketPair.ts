'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export default class BracketPair {
    
    readonly openCharacter: string;
    readonly closeCharacter: string;
    readonly colors : string[];
    readonly orphanColor: string;

    constructor(firstBracket: string, lastBracket: string, colors: string[], orphanColor : string) {
        this.openCharacter = firstBracket;
        this.closeCharacter = lastBracket;
        this.colors = colors;
        this.orphanColor = orphanColor;
    }
}