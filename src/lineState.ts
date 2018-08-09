import { Position, Range } from "vscode";
import BracketPair from "./bracketPair";
import ColorMode from "./colorMode";
import ColorIndexes from "./IColorIndexes";
import ModifierPair from "./modifierPair";
import MultipleIndexes from "./multipleIndexes";
import Scope from "./scope";
import Settings from "./settings";
import SingularIndex from "./singularIndex";

export default class LineState {
    private colorIndexes: ColorIndexes;
    private previousBracketColor: string;
    private readonly settings: Settings;

    constructor(settings: Settings, previousState?:
        {
            colorIndexes: ColorIndexes;
            previousBracketColor: string;
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.colorIndexes = previousState.colorIndexes;
            this.previousBracketColor = previousState.previousBracketColor;
        }
        else {
            switch (settings.colorMode) {
                case ColorMode.Consecutive: this.colorIndexes = new SingularIndex(settings);
                    break;
                case ColorMode.Independent: this.colorIndexes = new MultipleIndexes(settings);
                    break;
                default: throw new RangeError("Not implemented enum value");
            }
        }
    }

    public getOpenBrackets() {
        return this.colorIndexes.getOpenBrackets();
    }

    public copyMultilineContext(): LineState {
        const clone =
        {
            colorIndexes: this.colorIndexes.clone(),
            previousBracketColor: this.previousBracketColor,
        };

        return new LineState(this.settings, clone);
    }

    public getScope(position: Position): Scope | undefined {
        return this.colorIndexes.getScope(position);
    }

    public getBracketColor(type: string | undefined, depth: number, range: Range): string {
        if (!type) {
            this.previousBracketColor = this.settings.orphanColor;
            return this.settings.orphanColor;
        }

        if (this.colorIndexes.isClosingPairForCurrentStack(type, depth)) {
            return this.getCloseBracketColor(type, depth, range);
        }
        return this.getOpenBracketColor(type, depth, range);
    }

    private getOpenBracketColor(type: string, depth: number, range: Range): string {
        let colorIndex: number;

        if (this.settings.forceIterationColorCycle) {
            colorIndex = (this.colorIndexes.getPreviousIndex(type) + 1) % this.settings.colors.length;
        }
        else {
            colorIndex = this.colorIndexes.getCurrentLength(type) % this.settings.colors.length;
        }

        let color = this.settings.colors[colorIndex];

        if (this.settings.forceUniqueOpeningColor && color === this.previousBracketColor) {
            colorIndex = (colorIndex + 1) % this.settings.colors.length;
            color = this.settings.colors[colorIndex];
        }

        this.previousBracketColor = color;
        this.colorIndexes.setCurrent(type, depth, range, colorIndex);

        return color;
    };

    private getCloseBracketColor(type: string, depth: number, range: Range): string {
        const colorIndex = this.colorIndexes.getCurrentColorIndex(type, depth, range);
        let color: string;
        if (colorIndex !== undefined) {
            color = this.settings.colors[colorIndex];
        }
        else {
            color = this.settings.orphanColor;
        }

        this.previousBracketColor = color;

        return color;
    }
}
