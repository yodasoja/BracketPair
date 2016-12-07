'use strict';

import * as vscode from 'vscode';
import Settings from "./settings";
import ColorMode from './colorMode';

export default class TextLine {
    colorRanges = new Map<string, vscode.Range[]>();
    private bracketColors: { [character: string]: number[]; } = {};
    private readonly settings: Settings;
    lastCloseBracketColorIndex?: number;

    constructor(settings: Settings, previousLine?: TextLine) {
        this.settings = settings;

        if (previousLine !== undefined) {
            // Mantain previous lines bracket count, so if lines are invalidated, not everything has to be recalculated
            for (let key in previousLine.bracketColors) {
                this.bracketColors[key] = previousLine.bracketColors[key].slice();
            }
            this.lastCloseBracketColorIndex = previousLine.lastCloseBracketColorIndex;
        }
        else {
            for (let bracketPair of settings.bracketPairs) {
                this.bracketColors[bracketPair.openCharacter] = [];
                this.bracketColors[bracketPair.closeCharacter] = [];
            }
        }
    }

    addBracket(bracket: string, range: vscode.Range) {
        for (let bracketPair of this.settings.bracketPairs) {
            // If open bracket matches
            if (bracketPair.openCharacter === bracket) {
                let colorIndex: number;
                if (this.settings.colorMode === ColorMode.Consecutive) {
                    let unmatchedOpenBracketCount = 0;
                    Object.keys(this.bracketColors).forEach(key => {
                        unmatchedOpenBracketCount += this.bracketColors[key].length;
                    });

                    console.log(unmatchedOpenBracketCount);
                    colorIndex = unmatchedOpenBracketCount;
                }
                else {
                    colorIndex = this.bracketColors[bracketPair.openCharacter].length;
                }

                if (this.settings.ensureUniqueOpeningColor && colorIndex === this.lastCloseBracketColorIndex) {
                    colorIndex++;
                }

                colorIndex %= bracketPair.colors.length;

                let color = bracketPair.colors[colorIndex];

                let colorRanges = this.colorRanges.get(color);
                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }
                this.bracketColors[bracketPair.openCharacter].push(colorIndex);

                return;
            }
            else if (bracketPair.closeCharacter === bracket) {
                // If close bracket, and has an open pair
                this.lastCloseBracketColorIndex = this.bracketColors[bracketPair.openCharacter].pop();
                if (this.lastCloseBracketColorIndex !== undefined) {
                    let color = bracketPair.colors[this.lastCloseBracketColorIndex];

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