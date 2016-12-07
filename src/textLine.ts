'use strict';

import * as vscode from 'vscode';
import Settings from "./settings";
import ColorMode from './colorMode';

export default class TextLine {
    colorRanges = new Map<string, vscode.Range[]>();
    private bracketColors: { [character: string]: number[]; } = {};
    private readonly settings: Settings;
    lastBracketColor = "";

    constructor(settings: Settings, previousLine?: TextLine) {
        this.settings = settings;

        if (previousLine !== undefined) {
            // Mantain previous lines bracket count, so if lines are invalidated, not everything has to be recalculated
            for (let key in previousLine.bracketColors) {
                this.bracketColors[key] = previousLine.bracketColors[key].slice();
            }
            this.lastBracketColor = previousLine.lastBracketColor;
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

                    colorIndex = unmatchedOpenBracketCount % bracketPair.colors.length;
                }
                else {
                    colorIndex = this.bracketColors[bracketPair.openCharacter].length % bracketPair.colors.length;
                }

                let color = bracketPair.colors[colorIndex];

                if (this.settings.ensureUniqueOpeningColor && color === this.lastBracketColor) {
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
                this.bracketColors[bracketPair.openCharacter].push(colorIndex);

                this.lastBracketColor = color;
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

                this.lastBracketColor = color;
                return;
            }
        }
    }
}