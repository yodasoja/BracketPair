'use strict';
import BracketPair from "./bracketPair";
import ColorIndexes from "./colorIndexes";
import * as assert from 'assert';

export default class SingularIndex implements ColorIndexes {
    private currentOpenBracketColorIndexes: number[] = [];
    private previousOpenBracketColorIndex: number = -1;

    constructor(currentOpenBracketColorIndexes?: number[], previousOpenBracketColorIndex?: number) {
        // TODO Optional values are tightly coupled, should be all or nothing. Find a better way of doing this.
        assert((
            currentOpenBracketColorIndexes !== undefined &&
            previousOpenBracketColorIndex !== undefined)
            ||
            (currentOpenBracketColorIndexes === undefined &&
                previousOpenBracketColorIndex === undefined));

        if (currentOpenBracketColorIndexes !== undefined) {
            this.currentOpenBracketColorIndexes = currentOpenBracketColorIndexes;
        }

        if (previousOpenBracketColorIndex !== undefined) {
            this.previousOpenBracketColorIndex = previousOpenBracketColorIndex;
        }
    }

    setPrevious(bracketPair: BracketPair, colorIndex: number) {
        this.previousOpenBracketColorIndex = colorIndex;
    }

    getPrevious(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndex;
    }

    setCurrent(bracketPair: BracketPair, colorIndex: number) {
        this.currentOpenBracketColorIndexes.push(colorIndex);
    }

    getCurrent(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[this.currentOpenBracketColorIndexes.length - 1];
    }

    getCurrentLength(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes.length;
    }

    popCurrent(bracketPair: BracketPair): number | undefined {
        return this.currentOpenBracketColorIndexes.pop();
    }

    deepCopy() {
        return new SingularIndex(
            this.currentOpenBracketColorIndexes.slice(),
            this.previousOpenBracketColorIndex);
    }
}