import * as vscode from "vscode";
import BracketPair from "./bracketPair";
import ColorIndexes from "./IColorIndexes";
import Settings from "./settings";

type RangeAndIndex = { range: vscode.Range, index: number };
export default class MultipleIndexes implements ColorIndexes {
    private currentOpenBracketColorIndexes: { [character: string]: RangeAndIndex[]; } = {};
    private previousOpenBracketColorIndexes: { [character: string]: number; } = {};
    private pairedPositions: Array<{ open: vscode.Range, close: vscode.Range }> = [];
    private readonly settings: Settings;

    constructor(
        settings: Settings,
        previousState?: {
            currentOpenBracketColorIndexes: { [character: string]: RangeAndIndex[]; },
            previousOpenBracketColorIndexes: { [character: string]: number; },
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.currentOpenBracketColorIndexes = previousState.currentOpenBracketColorIndexes;
            this.previousOpenBracketColorIndexes = previousState.previousOpenBracketColorIndexes;

        }
        else {
            settings.bracketPairs.forEach((bracketPair) => {
                this.currentOpenBracketColorIndexes[bracketPair.openCharacter] = [];
                this.previousOpenBracketColorIndexes[bracketPair.openCharacter] = -1;
            });
        }
    }

    public getPreviousIndex(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndexes[bracketPair.openCharacter];
    }

    public setCurrent(bracketPair: BracketPair, range: vscode.Range, colorIndex: number) {
        this.currentOpenBracketColorIndexes[bracketPair.openCharacter].push({ range, index: colorIndex });
        this.previousOpenBracketColorIndexes[bracketPair.openCharacter] = colorIndex;
    }

    public getCurrentLength(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].length;
    }

    public popCurrent(bracketPair: BracketPair, range: vscode.Range): number | undefined {
        const positionAndIndex = this.currentOpenBracketColorIndexes[bracketPair.openCharacter].pop();
        if (positionAndIndex) {
            this.pairedPositions.push({ open: positionAndIndex.range, close: range });
            return positionAndIndex.index;
        }
    }

    public clone(): ColorIndexes {
        const bracketColorIndexesCopy: { [character: string]: RangeAndIndex[]; } = {};

        Object.keys(this.currentOpenBracketColorIndexes).forEach((key) => {
            bracketColorIndexesCopy[key] = this.currentOpenBracketColorIndexes[key].slice();
        });

        const previousOpenBracketIndexesCopy: { [character: string]: number; } = {};

        Object.keys(this.previousOpenBracketColorIndexes).forEach((key) => {
            previousOpenBracketIndexesCopy[key] = this.previousOpenBracketColorIndexes[key];
        });

        return new MultipleIndexes(
            this.settings,
            {
                currentOpenBracketColorIndexes: bracketColorIndexesCopy,
                previousOpenBracketColorIndexes: previousOpenBracketIndexesCopy,
            });
    }
}
