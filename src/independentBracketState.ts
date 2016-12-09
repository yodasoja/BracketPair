'use strict';
import BracketState from './bracketState';
import Settings from "./settings";
import BracketPair from "./bracketPair";
import * as assert from 'assert';

export default class IndependentBracketState extends BracketState {
    private currentOpenBracketColorIndexes: { [character: string]: number[]; } = {};
    private previousOpenBracketColorIndexes: { [character: string]: number; } = {};

    constructor(
        settings: Settings,
        bracketColorIndexes?: { [character: string]: number[]; },
        previousOpenBracketIndexes?: { [character: string]: number; },
        previousBracketColor?: string) {
        super(settings);
        // TODO Optional values are tightly coupled, should be all or nothing. Find a better way of doing this.
        assert((
            bracketColorIndexes !== undefined &&
            previousOpenBracketIndexes !== undefined &&
            previousBracketColor !== undefined)
            ||
            (
                bracketColorIndexes === undefined &&
                previousOpenBracketIndexes === undefined &&
                previousBracketColor === undefined));

        if (bracketColorIndexes !== undefined) {
            this.currentOpenBracketColorIndexes = bracketColorIndexes;
        }
        else {
            this.settings.bracketPairs.forEach(bracketPair => {
                this.currentOpenBracketColorIndexes[bracketPair.openCharacter] = [];
            });
        }

        if (previousOpenBracketIndexes !== undefined) {
            this.previousOpenBracketColorIndexes = previousOpenBracketIndexes;
        }
        else {
            this.settings.bracketPairs.forEach(bracketPair => {
                this.previousOpenBracketColorIndexes[bracketPair.openCharacter] = -1;
            });
        }

        if (previousBracketColor !== undefined) {
            this.previousBracketColor = previousBracketColor;
        }
    }

    deepCopy(): BracketState {
        let bracketColorIndexesCopy: { [character: string]: number[]; } = {};

        Object.keys(this.currentOpenBracketColorIndexes).forEach(key => {
            bracketColorIndexesCopy[key] = this.currentOpenBracketColorIndexes[key].slice();
        });

        let previousOpenBracketIndexesCopy: { [character: string]: number; } = {};

        Object.keys(this.previousOpenBracketColorIndexes).forEach(key => {
            previousOpenBracketIndexesCopy[key] = this.previousOpenBracketColorIndexes[key];
        });

        return new IndependentBracketState(
            this.settings,
            bracketColorIndexesCopy,
            previousOpenBracketIndexesCopy,
            this.previousBracketColor);
    }

    protected setPreviousColorIndex(bracketPair: BracketPair, colorIndex: number) {
        this.previousOpenBracketColorIndexes[bracketPair.openCharacter] = colorIndex;
    }

    protected getPreviousColorIndex(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndexes[bracketPair.openCharacter];
    }

    protected setCurrentColorIndex(bracketPair: BracketPair, colorIndex: number) {
        this.currentOpenBracketColorIndexes[bracketPair.openCharacter].push(colorIndex);
    }

    protected getCurrentColorIndex(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter][this.currentOpenBracketColorIndexes[bracketPair.openCharacter].length - 1];
    }

    protected getAmountOfOpenBrackets(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].length;
    }

    protected popCurrentColorIndex(bracketPair: BracketPair): number | undefined {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].pop();
    }
}