import * as vscode from "vscode";
import BracketPair from "./bracketPair";
import ColorIndexes from "./IColorIndexes";

type RangeAndIndex = { range: vscode.Range, index: number };
export default class SingularIndex implements ColorIndexes {
    private currentOpenBracketColorIndexes: RangeAndIndex[] = [];
    private previousOpenBracketColorIndex: number = -1;
    private pairedPositions: Array<{ open: vscode.Range, close: vscode.Range }> = [];

    constructor(
        previousState?: {
            currentOpenBracketColorIndexes: RangeAndIndex[],
            previousOpenBracketColorIndex: number,
        }) {

        if (previousState !== undefined) {
            this.currentOpenBracketColorIndexes = previousState.currentOpenBracketColorIndexes;
            this.previousOpenBracketColorIndex = previousState.previousOpenBracketColorIndex;
        }
    }

    public clone() {
        return new SingularIndex(
            {
                currentOpenBracketColorIndexes: this.currentOpenBracketColorIndexes.slice(),
                previousOpenBracketColorIndex: this.previousOpenBracketColorIndex,
            });
    }

    public getPreviousIndex(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndex;
    }

    public setCurrent(bracketPair: BracketPair, range: vscode.Range, colorIndex: number) {
        this.currentOpenBracketColorIndexes.push({ range, index: colorIndex });
        this.previousOpenBracketColorIndex = colorIndex;
    }

    public getCurrentLength(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes.length;
    }

    public popCurrent(bracketPair: BracketPair, range: vscode.Range): number | undefined {
        const rangeAndIndex = this.currentOpenBracketColorIndexes.pop();
        if (rangeAndIndex) {
            this.pairedPositions.push({ open: rangeAndIndex.range, close: range });
            return rangeAndIndex.index;
        }
    }
}
