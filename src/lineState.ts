import { Position, Range } from "vscode";
import BracketPair from "./bracketPair";
import ColorMode from "./colorMode";
import ColorIndexes from "./IColorIndexes";
import ModifierPair from "./modifierPair";
import MultipleIndexes from "./multipleIndexes";
import Scope from "./scope";
import Settings from "./settings";
import SingularIndex from "./singularIndex";
import TextLine from "./textLine";

export default class LineState {
    private readonly colorIndexes: ColorIndexes;
    private previousBracketColor: string;
    private readonly settings: Settings;
    private readonly charStack: Map<string, string[]>;

    constructor(settings: Settings, previousState?:
        {
            readonly colorIndexes: ColorIndexes;
            readonly previousBracketColor: string;
            readonly charStack: Map<string, string[]>;
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.colorIndexes = previousState.colorIndexes;
            this.previousBracketColor = previousState.previousBracketColor;
            this.charStack = previousState.charStack;
        }
        else {
            this.charStack = new Map<string, string[]>();
            switch (settings.colorMode) {
                case ColorMode.Consecutive: this.colorIndexes = new SingularIndex(settings);
                    break;
                case ColorMode.Independent: this.colorIndexes = new MultipleIndexes(settings);
                    break;
                default: throw new RangeError("Not implemented enum value");
            }
        }
    }

    public getCharStack() {
        return this.charStack;
    }

    public getOpenBrackets() {
        return this.colorIndexes.getOpenBrackets();
    }

    public cloneState(): LineState {
        const clone =
        {
            charStack: this.cloneCharStack(),
            colorIndexes: this.colorIndexes.clone(),
            previousBracketColor: this.previousBracketColor,
        };

        return new LineState(this.settings, clone);
    }

    public getScope(position: Position): Scope | undefined {
        return this.colorIndexes.getScope(position);
    }

    public getBracketColor(type: string | undefined, depth: number, beginIndex: number, endIndex: number, line: TextLine): string {
        if (!type) {
            this.previousBracketColor = this.settings.orphanColor;
            return this.settings.orphanColor;
        }

        if (this.colorIndexes.isClosingPairForCurrentStack(type, depth)) {
            return this.getCloseBracketColor(type, depth, beginIndex, endIndex, line);
        }
        return this.getOpenBracketColor(type, depth, beginIndex, endIndex, line);
    }

    private cloneCharStack() {
        const clone = new Map<string, string[]>();
        this.charStack.forEach((value, key) => {
            clone.set(key, value.slice());
        });
        return clone;
    }

    private getOpenBracketColor(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine): string {
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
        this.colorIndexes.setCurrent(type, depth, beginIndex, endIndex, line, colorIndex);

        return color;
    };

    private getCloseBracketColor(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine): string {
        const colorIndex = this.colorIndexes.getCurrentColorIndex(type, depth, beginIndex, endIndex, line);
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
