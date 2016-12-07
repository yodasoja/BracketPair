'use strict';

import * as vscode from 'vscode';
import Settings from "./settings";
import ColorMode from './colorMode';

export default class TextLine {
    colorRanges = new Map<string, vscode.Range[]>();
    bracketColors: { [character: string]: number[]; } = {};
    previousOpenBracketIndexes: { [character: string]: number; } = {};
    previousOpenBracketIndex = -1;
    private readonly settings: Settings;
    private previousBracketColor = "";

    constructor(settings: Settings, previousLine?: TextLine) {
        this.settings = settings;

        if (previousLine !== undefined) {
            // Mantain previous lines bracket count, so if lines are invalidated, not everything has to be recalculated
            Object.keys(previousLine.bracketColors).forEach(key => {
                this.bracketColors[key] = previousLine.bracketColors[key].slice();
            });

            Object.keys(previousLine.previousOpenBracketIndexes).forEach(key => {
                this.previousOpenBracketIndexes[key] = previousLine.previousOpenBracketIndexes[key];
            });

            this.previousOpenBracketIndex = previousLine.previousOpenBracketIndex;
            this.previousBracketColor = previousLine.previousBracketColor;
        }
        else {
            for (let bracketPair of settings.bracketPairs) {
                this.bracketColors[bracketPair.openCharacter] = [];
                this.bracketColors[bracketPair.closeCharacter] = [];
                this.previousOpenBracketIndexes[bracketPair.openCharacter] = -1;
            }
        }
    }

    addBracket(bracket: string, range: vscode.Range) {
        for (let bracketPair of this.settings.bracketPairs) {
            // If open bracket matches
            if (bracketPair.openCharacter === bracket) {

                let colorIndex: number;

                if (this.settings.colorMode === ColorMode.Consecutive) {
                    if (this.settings.forceIterationColorCycle) {
                        colorIndex = (this.previousOpenBracketIndex + 1) % bracketPair.colors.length;
                    }
                    else {
                        let unmatchedOpenBracketCount = 0;
                        Object.keys(this.bracketColors).forEach(key => {
                            unmatchedOpenBracketCount += this.bracketColors[key].length;
                        });
                        colorIndex = unmatchedOpenBracketCount % bracketPair.colors.length;
                    }
                }
                else {
                    if (this.settings.forceIterationColorCycle) {
                        colorIndex = (this.previousOpenBracketIndexes[bracket] + 1) % bracketPair.colors.length;
                    }
                    else {
                        colorIndex = this.bracketColors[bracket].length % bracketPair.colors.length;
                    }
                }

                let color = bracketPair.colors[colorIndex];

                if (this.settings.ensureUniqueOpeningColor && color === this.previousBracketColor) {
                    colorIndex = (colorIndex + 1) % bracketPair.colors.length;
                    color = bracketPair.colors[colorIndex];
                }

                let colorRanges = this.colorRanges.get(color);
                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }
                this.bracketColors[bracket].push(colorIndex);
                this.previousBracketColor = color;

                if (this.settings.colorMode === ColorMode.Consecutive) {
                    this.previousOpenBracketIndex = colorIndex;
                }
                else {
                    this.previousOpenBracketIndexes[bracket] = colorIndex;
                }
                return;
            }
            else if (bracketPair.closeCharacter === bracket) {
                // If close bracket, and has an open pair
                let colorIndex = this.bracketColors[bracketPair.openCharacter].pop();
                let color: string;
                if (colorIndex !== undefined) {
                    color = bracketPair.colors[colorIndex];
                }
                else {
                    color = bracketPair.orphanColor;
                }

                let colorRanges = this.colorRanges.get(color);
                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }

                this.previousBracketColor = color;
                return;
            }
        }
    }
}