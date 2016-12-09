'use strict';
import BracketPair from "./bracketPair";
import ColorIndexes from "./colorIndexes";
import * as assert from 'assert';
import Settings from "./settings";

export default class IndependentColorIndexes implements ColorIndexes {
    private currentOpenBracketColorIndexes: { [character: string]: number[]; } = {};
    private previousOpenBracketColorIndexes: { [character: string]: number; } = {};
    private readonly settings: Settings;

    constructor(settings: Settings, currentOpenBracketColorIndexes?: { [character: string]: number[]; }, previousOpenBracketColorIndexes?: { [character: string]: number; }) {
        this.settings = settings;

        // TODO Optional values are tightly coupled, should be all or nothing. Find a better way of doing this.
        assert((
            currentOpenBracketColorIndexes !== undefined &&
            previousOpenBracketColorIndexes !== undefined)
            ||
            (currentOpenBracketColorIndexes === undefined &&
                previousOpenBracketColorIndexes === undefined));

        if (currentOpenBracketColorIndexes !== undefined) {
            this.currentOpenBracketColorIndexes = currentOpenBracketColorIndexes;
        }
        else {
            settings.bracketPairs.forEach(bracketPair => {
                this.currentOpenBracketColorIndexes[bracketPair.openCharacter] = [];
            });
        }

        if (previousOpenBracketColorIndexes !== undefined) {
            this.previousOpenBracketColorIndexes = previousOpenBracketColorIndexes;
        }
        else {
            settings.bracketPairs.forEach(bracketPair => {
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

    getCurrent(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter][this.currentOpenBracketColorIndexes[bracketPair.openCharacter].length - 1];
    }

    getCurrentLength(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].length;
    }

    popCurrent(bracketPair: BracketPair): number | undefined {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].pop();
    }

    deepCopy(): ColorIndexes {
        let bracketColorIndexesCopy: { [character: string]: number[]; } = {};

        Object.keys(this.currentOpenBracketColorIndexes).forEach(key => {
            bracketColorIndexesCopy[key] = this.currentOpenBracketColorIndexes[key].slice();
        });

        let previousOpenBracketIndexesCopy: { [character: string]: number; } = {};

        Object.keys(this.previousOpenBracketColorIndexes).forEach(key => {
            previousOpenBracketIndexesCopy[key] = this.previousOpenBracketColorIndexes[key];
        });

        return new IndependentColorIndexes(
            this.settings,
            bracketColorIndexesCopy,
            previousOpenBracketIndexesCopy);
    }
}