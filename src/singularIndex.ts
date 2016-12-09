'use strict';
import BracketPair from "./bracketPair";
import ColorIndexes from "./colorIndexes";

export default class SingularIndex implements ColorIndexes {
    private currentOpenBracketColorIndexes: number[] = [];
    private previousOpenBracketColorIndex: number = -1;

    constructor(
        previousState?: {
            currentOpenBracketColorIndexes: number[],
            previousOpenBracketColorIndex: number
        }) {

        if (previousState !== undefined) {
            this.currentOpenBracketColorIndexes = previousState.currentOpenBracketColorIndexes;
            this.previousOpenBracketColorIndex = previousState.previousOpenBracketColorIndex;
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

    getCurrentLength(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes.length;
    }

    popCurrent(bracketPair: BracketPair): number | undefined {
        return this.currentOpenBracketColorIndexes.pop();
    }

    clone() {
        return new SingularIndex(
            {
                currentOpenBracketColorIndexes: this.currentOpenBracketColorIndexes.slice(),
                previousOpenBracketColorIndex: this.previousOpenBracketColorIndex
            });
    }
}