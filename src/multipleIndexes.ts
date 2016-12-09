'use strict';
import BracketPair from "./bracketPair";
import ColorIndexes from "./colorIndexes";
import Settings from "./settings";

export default class MultipleIndexes implements ColorIndexes {
    private currentOpenBracketColorIndexes: { [character: string]: number[]; } = {};
    private previousOpenBracketColorIndexes: { [character: string]: number; } = {};
    private readonly settings: Settings;

    constructor(
        settings: Settings,
        previousState?: {
            currentOpenBracketColorIndexes: { [character: string]: number[]; },
            previousOpenBracketColorIndexes: { [character: string]: number; }
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.currentOpenBracketColorIndexes = previousState.currentOpenBracketColorIndexes;
            this.previousOpenBracketColorIndexes = previousState.previousOpenBracketColorIndexes;

        }
        else {
            settings.bracketPairs.forEach(bracketPair => {
                this.currentOpenBracketColorIndexes[bracketPair.openCharacter] = [];
                this.previousOpenBracketColorIndexes[bracketPair.openCharacter] = -1;
            });
        }
    }

    setPrevious(bracketPair: BracketPair, colorIndex: number) {
        this.previousOpenBracketColorIndexes[bracketPair.openCharacter] = colorIndex;
    }

    getPrevious(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndexes[bracketPair.openCharacter];
    }

    setCurrent(bracketPair: BracketPair, colorIndex: number) {
        this.currentOpenBracketColorIndexes[bracketPair.openCharacter].push(colorIndex);
    }

    getCurrentLength(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].length;
    }

    popCurrent(bracketPair: BracketPair): number | undefined {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].pop();
    }

    clone(): ColorIndexes {
        let bracketColorIndexesCopy: { [character: string]: number[]; } = {};

        Object.keys(this.currentOpenBracketColorIndexes).forEach(key => {
            bracketColorIndexesCopy[key] = this.currentOpenBracketColorIndexes[key].slice();
        });

        let previousOpenBracketIndexesCopy: { [character: string]: number; } = {};

        Object.keys(this.previousOpenBracketColorIndexes).forEach(key => {
            previousOpenBracketIndexesCopy[key] = this.previousOpenBracketColorIndexes[key];
        });

        return new MultipleIndexes(
            this.settings,
            {
                currentOpenBracketColorIndexes: bracketColorIndexesCopy,
                previousOpenBracketColorIndexes: previousOpenBracketIndexesCopy
            });
    }
}