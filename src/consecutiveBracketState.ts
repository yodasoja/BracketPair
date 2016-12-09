'use strict';
import BracketState from './bracketState';
import Settings from "./settings";
import BracketPair from "./bracketPair";
import * as assert from 'assert';

export default class ConsecutiveBracketState extends BracketState {
    private currentOpenBracketColorIndexes: number[] = [];
    private previousOpenBracketColorIndex: number = -1;

    constructor(
        settings: Settings,
        lastColorIndex?: number,
        bracketColorIndexes?: number[],
        previousBracketColor?: string) {
        super(settings);
        // TODO Optional values are tightly coupled, should be all or nothing. Find a better way of doing this.
        assert((lastColorIndex !== undefined &&
            bracketColorIndexes !== undefined &&
            previousBracketColor !== undefined)
            ||
            ((lastColorIndex === undefined &&
                bracketColorIndexes === undefined &&
                previousBracketColor === undefined)));

        if (lastColorIndex !== undefined) {
            this.previousOpenBracketColorIndex = lastColorIndex;
        }

        if (bracketColorIndexes !== undefined) {
            this.currentOpenBracketColorIndexes = bracketColorIndexes;
        }

        if (previousBracketColor !== undefined) {
            this.previousBracketColor = previousBracketColor;
        }
    }

    deepCopy(): BracketState {
        return new ConsecutiveBracketState(
            this.settings,
            this.previousOpenBracketColorIndex,
            this.currentOpenBracketColorIndexes.slice(),
            this.previousBracketColor);
    }

    protected setPreviousColorIndex(bracketPair: BracketPair, colorIndex: number) {
        this.previousOpenBracketColorIndex = colorIndex;
    }

    protected getPreviousColorIndex(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndex;
    }

    protected setCurrentColorIndex(bracketPair: BracketPair, colorIndex: number) {
        this.currentOpenBracketColorIndexes.push(colorIndex);
    }

    protected getCurrentColorIndex(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[this.currentOpenBracketColorIndexes.length - 1];
    }

    protected getAmountOfOpenBrackets(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes.length;
    }

    protected popCurrentColorIndex(bracketPair: BracketPair): number | undefined {
        return this.currentOpenBracketColorIndexes.pop();
    }
}