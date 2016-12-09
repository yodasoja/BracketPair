'use strict';
import BracketState from './bracketState';
import Settings from "./settings";
import BracketPair from "./bracketPair"

export default class ConsecutiveBracketState implements BracketState {
    private readonly settings: Settings;
    private previousOpenConsecutiveBracketIndex: number = -1;
    private bracketColorIndexes: { [character: string]: number[]; } = {};

    constructor(
        settings: Settings,
        previousOpenConsecutiveBracketIndex?: number,
        bracketColorIndexes?: { [character: string]: number[]; }) {
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
    }

    deepCopy(): BracketState {
        let bracketColorIndexesCopy: { [character: string]: number[]; } = {}

        Object.keys(this.bracketColorIndexes).forEach(key => {
            bracketColorIndexesCopy[key] = this.bracketColorIndexes[key].slice();
        });

        return new ConsecutiveBracketState(this.settings, this.previousOpenConsecutiveBracketIndex, bracketColorIndexesCopy);
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

        return colorIndex;
    };

    setColorIndex(bracket: string, colorIndex: number): void {
        this.bracketColorIndexes[bracket].push(colorIndex);
        this.previousOpenConsecutiveBracketIndex = colorIndex;
    }

    popColorIndex(bracket: string): number | undefined {
        return this.bracketColorIndexes[bracket].pop();
    }
}