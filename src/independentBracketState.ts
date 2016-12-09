'use strict';
import BracketState from './bracketState';
import Settings from "./settings";
import BracketPair from "./bracketPair"

export default class IndependentBracketState implements BracketState {
    private readonly settings: Settings;
    private bracketColorIndexes: { [character: string]: number[]; } = {};
    previousOpenBracketIndexes: { [character: string]: number; } = {};

    constructor(
        settings: Settings,
        bracketColorIndexes?: { [character: string]: number[]; },
        previousOpenBracketIndexes?: { [character: string]: number; }) {
        this.settings = settings;

        if (bracketColorIndexes !== undefined) {
            this.bracketColorIndexes = bracketColorIndexes;
        }
        else {
            this.settings.bracketPairs.forEach(bracketPair => {
                this.bracketColorIndexes[bracketPair.openCharacter] = [];
            });
        }

        if (previousOpenBracketIndexes !== undefined) {
            this.previousOpenBracketIndexes = previousOpenBracketIndexes;
        }
        else {
            this.settings.bracketPairs.forEach(bracketPair => {
                this.previousOpenBracketIndexes[bracketPair.openCharacter] = -1;
            });
        }
    }

    deepCopy(): BracketState {
        let bracketColorIndexesCopy: { [character: string]: number[]; } = {}

        Object.keys(this.bracketColorIndexes).forEach(key => {
            bracketColorIndexesCopy[key] = this.bracketColorIndexes[key].slice();
        });

        let previousOpenBracketIndexesCopy: { [character: string]: number; } = {};

        Object.keys(this.previousOpenBracketIndexes).forEach(key => {
            previousOpenBracketIndexesCopy[key] = this.previousOpenBracketIndexes[key];
        });

        return new IndependentBracketState(this.settings, bracketColorIndexesCopy, previousOpenBracketIndexesCopy);
    }

    getColorIndex(bracketPair: BracketPair): number {
        let colorIndex: number;
        if (this.settings.forceIterationColorCycle) {
            colorIndex = (this.previousOpenBracketIndexes[bracketPair.openCharacter] + 1) % bracketPair.colors.length;
        }
        else {
            colorIndex = this.bracketColorIndexes[bracketPair.openCharacter].length % bracketPair.colors.length;
        }

        return colorIndex;
    };

    setColorIndex(bracket: string, colorIndex: number): void {
        this.bracketColorIndexes[bracket].push(colorIndex);
        this.previousOpenBracketIndexes[bracket] = colorIndex;
    }

    popColorIndex(bracket: string): number | undefined {
        return this.bracketColorIndexes[bracket].pop();
    }
}