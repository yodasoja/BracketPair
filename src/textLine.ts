'use strict';

import * as vscode from 'vscode';
import Settings from "./settings";
import BracketState from './bracketState';

export default class TextLine {
    bracketState: BracketState;
    colorRanges = new Map<string, vscode.Range[]>();
    private readonly settings: Settings;

    constructor(settings: Settings, previousLine?: TextLine) {
        this.settings = settings;

        if (previousLine !== undefined) {
            // Mantain previous lines bracket count, so if lines are invalidated, not everything has to be recalculated
            this.bracketState = previousLine.bracketState.deepCopy();
        }
        else {
            this.bracketState = new BracketState(settings);
        }
    }

    addBracket(bracket: string, range: vscode.Range) {
        for (let bracketPair of this.settings.bracketPairs) {
            if (bracketPair.openCharacter === bracket) {
                let color = this.bracketState.getOpenBracketColor(bracketPair);

                let colorRanges = this.colorRanges.get(color);

                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }
                return;
            }
            else if (bracketPair.closeCharacter === bracket) {
                let color = this.bracketState.getCloseBracketColor(bracketPair);

                let colorRanges = this.colorRanges.get(color);
                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }
                return;
            }
        }
    }
}