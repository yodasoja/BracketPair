import BracketPair from "./bracketPair";
import ColorMode from "./colorMode";
import ColorIndexes from "./IColorIndexes";
import ModifierPair from "./modifierPair";
import MultipleIndexes from "./multipleIndexes";
import Settings from "./settings";
import SingularIndex from "./singularIndex";

export default class MultiLineState {
    public commentModifiers: ModifierPair[] = [];
    public quoteModifiers: ModifierPair[] = [];
    private colorIndexes: ColorIndexes;
    private previousBracketColor: string;
    private readonly settings: Settings;

    constructor(settings: Settings, previousState?:
        {
            colorIndexes: ColorIndexes;
            previousBracketColor: string;
            commentModifiers: ModifierPair[];
            quoteModifiers: ModifierPair[];
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.colorIndexes = previousState.colorIndexes;
            this.previousBracketColor = previousState.previousBracketColor;
            this.commentModifiers = previousState.commentModifiers;
            this.quoteModifiers = previousState.quoteModifiers;
        }
        else {
            switch (settings.colorMode) {
                case ColorMode.Consecutive: this.colorIndexes = new SingularIndex();
                    break;
                case ColorMode.Independent: this.colorIndexes = new MultipleIndexes(settings);
                    break;
                default: throw new RangeError("Not implemented enum value");
            }

            this.quoteModifiers.push(new ModifierPair("\"", "\""));
            this.quoteModifiers.push(new ModifierPair("'", "'"));
            this.quoteModifiers.push(new ModifierPair("`", "`"));

            this.commentModifiers.push(new ModifierPair("/*", "*/"));
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

    public isQuoted(): boolean {
        for (const modifier of this.quoteModifiers) {
            if (modifier.counter > 0) {
                return true;
            }
        }

        return false;
    }

    public isCommented(): boolean {
        for (const modifier of this.commentModifiers) {
            if (modifier.counter > 0) {
                return true;
            }
        }

        return false;
    }

    public clone() {
        const cloneState =
            {
                colorIndexes: this.colorIndexes.clone(),
                commentModifiers: this.commentModifiers.map((modifier) => modifier.Clone()),
                previousBracketColor: this.previousBracketColor,
                quoteModifiers: this.quoteModifiers.map((modifier) => modifier.Clone()),
            };

        return new MultiLineState(this.settings, cloneState);
    }
}
