import BracketPair from "./bracketPair";
import ColorIndexes from "./IColorIndexes";
import Settings from "./settings";

export default class MultipleIndexes implements ColorIndexes {
    private currentOpenBracketColorIndexes: { [character: string]: number[]; } = {};
    private previousOpenBracketColorIndexes: { [character: string]: number; } = {};
    private readonly settings: Settings;

    constructor(
        settings: Settings,
        previousState?: {
            currentOpenBracketColorIndexes: { [character: string]: number[]; },
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

    public getPrevious(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndexes[bracketPair.openCharacter];
    }

    public setCurrent(bracketPair: BracketPair, colorIndex: number) {
        this.currentOpenBracketColorIndexes[bracketPair.openCharacter].push(colorIndex);
        this.previousOpenBracketColorIndexes[bracketPair.openCharacter] = colorIndex;
    }

    public getCurrentLength(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].length;
    }

    public popCurrent(bracketPair: BracketPair): number | undefined {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].pop();
    }

    public clone(): ColorIndexes {
        const bracketColorIndexesCopy: { [character: string]: number[]; } = {};

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
