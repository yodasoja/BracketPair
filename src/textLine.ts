'use strict';

import * as vscode from 'vscode';
import BracketPair from "./bracketPair";

export default class TextLine {
    colorRanges = new Map<string, vscode.Range[]>();
    bracketColorIndexes: { [character: string]: number[]; } = {};

    constructor(bracketPairs: BracketPair[], previousLine?: TextLine) {
        if (previousLine !== undefined) {
            // Mantain previous lines bracket count, so if lines are invalidated, not everything has to be recalculated
            for (let key in previousLine.bracketColorIndexes) {
                this.bracketColorIndexes[key] = previousLine.bracketColorIndexes[key].slice();
            }
        }
        else {
            for (let bracketPair of bracketPairs) {
                this.bracketColorIndexes[bracketPair.openCharacter] = [];
                this.bracketColorIndexes[bracketPair.closeCharacter] = [];
            }
        }
    }
}