'use strict';

import * as vscode from 'vscode';
import Settings from "./settings";
import ColorMode from './colorMode';
import BracketState from './bracketState';
import IndependentBracketState from "./independentBracketState";
import ConsecutiveBracketState from "./consecutiveBracketState";

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
            switch (settings.colorMode) {
                case ColorMode.Consecutive: this.bracketState = new ConsecutiveBracketState(settings);
                    break;
                case ColorMode.Independent: this.bracketState = new IndependentBracketState(settings);
                    break;
                default: throw new RangeError("Not implemented enum value");
            }
        }
    }

    addBracket(bracket: string, range: vscode.Range) {
        for (let bracketPair of this.settings.bracketPairs) {
            // If open bracket matches
            if (bracketPair.openCharacter === bracket) {

                let colorIndex = this.bracketState.getColorIndex(bracketPair);

                let color = bracketPair.colors[colorIndex];

                let colorRanges = this.colorRanges.get(color);

                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }

                this.bracketState.setColorIndex(bracketPair, colorIndex);
                return;
            }
            else if (bracketPair.closeCharacter === bracket) {
                // If close bracket, and has an open pair
                let color = this.bracketState.popColor(bracketPair);

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