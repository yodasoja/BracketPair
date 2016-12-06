'use strict';

import * as vscode from 'vscode';
import Settings from "./settings";
import ColorMode from './colorMode';

export default class TextLine {
    colorRanges = new Map<string, vscode.Range[]>();
    private bracketColorIndexes: { [character: string]: number[]; } = {};
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

    addBracket(bracket: string, range: vscode.Range) {
        for (let bracketPair of this.settings.bracketPairs) {
            // If open bracket matches
            if (bracketPair.openCharacter === bracket) {

                let colorIndex: number;
                if (this.settings.colorMode === ColorMode.Consecutive) {
                    colorIndex = this.consecutiveColorCount % bracketPair.colors.length;
                    this.consecutiveColorCount++;
                }
                else {
                    colorIndex = this.bracketColorIndexes[bracketPair.openCharacter].length % bracketPair.colors.length;
                }

                let color = bracketPair.colors[colorIndex];

                let colorRanges = this.colorRanges.get(color);
                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }
                this.bracketColorIndexes[bracketPair.openCharacter].push(colorIndex);

                return;
            }
            else if (bracketPair.closeCharacter === bracket) {
                // If close bracket, and has an open pair
                let colorIndex = this.bracketColorIndexes[bracketPair.openCharacter].pop();
                if (colorIndex !== undefined) {
                    if (this.settings.colorMode === ColorMode.Consecutive) {
                        this.consecutiveColorCount--;
                    }
                    let color = bracketPair.colors[colorIndex];

                    let colorRanges = this.colorRanges.get(color);
                    if (colorRanges !== undefined) {
                        colorRanges.push(range);
                    }
                    else {
                        this.colorRanges.set(color, [range]);
                    }
                }
                // If no more open brackets, close bracket is an 'orphan'
                else {
                    let colorRanges = this.colorRanges.get(bracketPair.orphanColor);
                    if (colorRanges !== undefined) {
                        colorRanges.push(range);
                    }
                    else {
                        this.colorRanges.set(bracketPair.orphanColor, [range]);
                    }
                }
                return;
            }
        }
    }
}