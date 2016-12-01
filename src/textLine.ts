'use strict';

import * as vscode from 'vscode';
import BracketPair from "./bracketPair";

export default class TextLine {
    colorRanges = new Map<string, vscode.Range[]>();
    bracketCount: { [character: string]: number; } = {};

    constructor(bracketPairs: BracketPair[], previousLine?: TextLine) {
        if (previousLine !== undefined) {
            // Mantain previous lines bracket count
            for (let key in previousLine.bracketCount) {
                this.bracketCount[key] = previousLine.bracketCount[key];
            }
        }
        else {
            for (let bracketPair of bracketPairs) {
                this.bracketCount[bracketPair.openCharacter] = 0;
                this.bracketCount[bracketPair.closeCharacter] = 0;
            }
        }
    }
}