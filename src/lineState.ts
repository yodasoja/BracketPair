import BracketPair from "./bracketPair";
import ColorMode from "./colorMode";
import ColorIndexes from "./IColorIndexes";
import ModifierPair from "./modifierPair";
import MultipleIndexes from "./multipleIndexes";
import Scope from "./scope";
import Settings from "./settings";
import SingularIndex from "./singularIndex";

export default class LineState {
    public activeScope: Scope | undefined;
    private colorIndexes: ColorIndexes;
    private previousBracketColor: string;
    private readonly settings: Settings;

    constructor(settings: Settings, previousState?:
        {
            colorIndexes: ColorIndexes;
            previousBracketColor: string;
            activeScope?: Scope;
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.colorIndexes = previousState.colorIndexes;
            this.previousBracketColor = previousState.previousBracketColor;

            // When assuming previous lines state, don't mantain single line comment state
            if (previousState.activeScope && !previousState.activeScope.isSingleLineComment()) {
                this.activeScope = previousState.activeScope;
            }
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

    public clone(): LineState {
        const clone =
            {
                activeScope: this.activeScope,
                colorIndexes: this.colorIndexes.clone(),
                previousBracketColor: this.previousBracketColor,
            };

        return new LineState(this.settings, clone);
    }
}
