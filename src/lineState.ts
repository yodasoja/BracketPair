import BracketPair from "./bracketPair";
import ColorMode from "./colorMode";
import ColorIndexes from "./IColorIndexes";
import MultipleIndexes from "./MultipleIndexes";
import Settings from "./settings";
import SingularIndex from "./singularIndex";

export default class LineState {
    public multilineModifiers = 0;
    public singleQuoteModifiers = 0;
    public doubleQuoteModifiers = 0;
    protected readonly settings: Settings;
    protected previousBracketColor = "";
    protected colorIndexes: ColorIndexes;

    constructor(
        settings: Settings,
        previousState?: {
            colorIndexes: ColorIndexes,
            bracketColor: string,
            multilineModifiers: number,
            singleQuoteModifiers: number,
            doubleQuoteModifiers: number,
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.previousBracketColor = previousState.bracketColor;
            this.colorIndexes = previousState.colorIndexes;
            this.multilineModifiers = previousState.multilineModifiers;
            this.singleQuoteModifiers = previousState.singleQuoteModifiers;
            this.doubleQuoteModifiers = previousState.doubleQuoteModifiers;
        }
        else {
            switch (settings.colorMode) {
                case ColorMode.Consecutive: this.colorIndexes = new SingularIndex();
                    break;
                case ColorMode.Independent: this.colorIndexes = new MultipleIndexes(settings);
                    break;
                default: throw new RangeError("Not implemented enum value");
            }
        }
    }

    public getOpenBracketColor(bracketPair: BracketPair): string {
        let colorIndex: number;

        if (this.settings.forceIterationColorCycle) {
            colorIndex = (this.colorIndexes.getPrevious(bracketPair) + 1) % bracketPair.colors.length;
        }
        else {
            colorIndex = this.colorIndexes.getCurrentLength(bracketPair) % bracketPair.colors.length;
        }

        let color = bracketPair.colors[colorIndex];

        if (this.settings.forceUniqueOpeningColor && color === this.previousBracketColor) {
            colorIndex = (colorIndex + 1) % bracketPair.colors.length;
            color = bracketPair.colors[colorIndex];
        }

        this.previousBracketColor = color;
        this.colorIndexes.setCurrent(bracketPair, colorIndex);

        return color;
    };

    public getCloseBracketColor(bracketPair: BracketPair): string {
        const colorIndex = this.colorIndexes.popCurrent(bracketPair);
        let color: string;
        if (colorIndex !== undefined) {
            color = bracketPair.colors[colorIndex];
        }
        else {
            color = bracketPair.orphanColor;
        }

        this.previousBracketColor = color;

        return color;
    }

    public clone() {
        return new LineState(
            this.settings,
            {
                bracketColor: this.previousBracketColor,
                colorIndexes: this.colorIndexes.clone(),
                doubleQuoteModifiers: this.doubleQuoteModifiers,
                multilineModifiers: this.multilineModifiers,
                singleQuoteModifiers: this.singleQuoteModifiers,
            });
    }

    public isQuoted(): boolean {
        return this.doubleQuoteModifiers !== 0 ||
            this.singleQuoteModifiers !== 0;
    }

    public isMultilineCommented(): boolean {
        return this.multilineModifiers !== 0;
    }
}
