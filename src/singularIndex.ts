import BracketPair from "./bracketPair";
import ColorIndexes from "./IColorIndexes";

export default class SingularIndex implements ColorIndexes {
    private currentOpenBracketColorIndexes: number[] = [];
    private previousOpenBracketColorIndex: number = -1;

    constructor(
        previousState?: {
            currentOpenBracketColorIndexes: number[],
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

    public getPrevious(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndex;
    }

    public setCurrent(bracketPair: BracketPair, colorIndex: number) {
        this.currentOpenBracketColorIndexes.push(colorIndex);
        this.previousOpenBracketColorIndex = colorIndex;
    }

    public getCurrentLength(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes.length;
    }

    public popCurrent(bracketPair: BracketPair): number | undefined {
        return this.currentOpenBracketColorIndexes.pop();
    }
}
