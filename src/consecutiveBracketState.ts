'use strict';
import BracketState from './bracketState';
import Settings from "./settings";
import BracketPair from "./bracketPair";

export default class ConsecutiveBracketState implements BracketState {
    private readonly settings: Settings;
    private previousOpenConsecutiveBracketIndex: number = -1;
    private bracketColorIndexes: { [character: string]: number[]; } = {};
    private previousBracketColor = "";

    constructor(
        settings: Settings,
        previousOpenConsecutiveBracketIndex?: number,
        bracketColorIndexes?: { [character: string]: number[]; },
        previousBracketColor?: string) {
        this.settings = settings;

        if (previousOpenConsecutiveBracketIndex !== undefined) {
            this.previousOpenConsecutiveBracketIndex = previousOpenConsecutiveBracketIndex;
        }

        if (bracketColorIndexes !== undefined) {
            this.bracketColorIndexes = bracketColorIndexes;
        }
        else {
            this.settings.bracketPairs.forEach(element => {
                this.bracketColorIndexes[element.openCharacter] = [];
            });
        }

        if (previousBracketColor !== undefined) {
            this.previousBracketColor = previousBracketColor;
        }
    }

    deepCopy(): BracketState {
        let bracketColorIndexesCopy: { [character: string]: number[]; } = {};

        Object.keys(this.bracketColorIndexes).forEach(key => {
            bracketColorIndexesCopy[key] = this.bracketColorIndexes[key].slice();
        });

        return new ConsecutiveBracketState(
            this.settings, 
            this.previousOpenConsecutiveBracketIndex, 
            bracketColorIndexesCopy, 
            this.previousBracketColor);
    }

    getColorIndex(bracketPair: BracketPair): number {
        let colorIndex: number;

        if (this.settings.forceIterationColorCycle) {
            colorIndex = (this.previousOpenConsecutiveBracketIndex + 1) % bracketPair.colors.length;
        }
        else {
            let unmatchedOpenBracketCount = 0;
            Object.keys(this.bracketColorIndexes).forEach(key => {
                unmatchedOpenBracketCount += this.bracketColorIndexes[key].length;
            });
            colorIndex = unmatchedOpenBracketCount % bracketPair.colors.length;
        }

        let color = bracketPair.colors[colorIndex];

        // Duplicate 2
        if (this.settings.forceUniqueOpeningColor && color === this.previousBracketColor) {
            colorIndex = (colorIndex + 1) % bracketPair.colors.length;
            color = bracketPair.colors[colorIndex];
        }
        this.previousBracketColor = color;

        return colorIndex;
    };

    // Duplicate 3
    setColorIndex(bracketPair: BracketPair, colorIndex: number): void {
        this.bracketColorIndexes[bracketPair.openCharacter].push(colorIndex);
        this.previousOpenConsecutiveBracketIndex = colorIndex;
    }

    // Duplicate 1
    popColor(bracketPair: BracketPair): string {
        let colorIndex = this.bracketColorIndexes[bracketPair.openCharacter].pop();
        let color: string;

        if (colorIndex !== undefined) {
            color = bracketPair.colors[colorIndex];
        }
        else {
            color = bracketPair.orphanColor;
        }

        this.previousBracketColor = color;
        return color;
    }
}