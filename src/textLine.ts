'use strict';

import * as vscode from 'vscode';
import Settings from "./settings";

export default class TextLine {
    colorRanges = new Map<string, vscode.Range[]>();
    bracketColorIndexes: { [character: string]: number[]; } = {};
    private readonly settings: Settings;
    consecutiveColorCount = 0;

    constructor(settings: Settings, previousLine?: TextLine) {
        this.settings = settings;

        if (previousLine !== undefined) {
            // Mantain previous lines bracket count, so if lines are invalidated, not everything has to be recalculated
            for (let key in previousLine.bracketColorIndexes) {
                this.bracketColorIndexes[key] = previousLine.bracketColorIndexes[key].slice();
            }

            this.consecutiveColorCount = previousLine.consecutiveColorCount;
        }
        else {
            for (let bracketPair of settings.bracketPairs) {
                this.bracketColorIndexes[bracketPair.openCharacter] = [];
                this.bracketColorIndexes[bracketPair.closeCharacter] = [];
            }
        }
    }
}