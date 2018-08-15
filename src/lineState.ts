import { Position } from "vscode";
import Bracket from "./bracket";
import ClosingBracket from "./closingBracket";
import ColorMode from "./colorMode";
import ColorIndexes from "./IColorIndexes";
import MultipleIndexes from "./multipleIndexes";
import Settings from "./settings";
import SingularIndex from "./singularIndex";
import TextLine from "./textLine";
import Token from "./token";

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

    public getOpenBracketStack()
    {
        return this.colorIndexes.getOpenBracketStack();
    }

    public getCharStack() {
        return this.charStack;
    }

    public cloneState(): LineState {
        const clone =
        {
            charStack: this.cloneCharStack(),
            colorIndexes: this.colorIndexes.copyCumulativeState(),
            previousBracketColor: this.previousBracketColor,
        };

        return new LineState(this.settings, clone);
    }

    public getClosingBracket(position: Position): ClosingBracket | undefined {
        return this.colorIndexes.getClosingBracket(position);
    }

    public getBracketColor(
        type: string | undefined,
        character: string,
        depth: number,
        beginIndex: number,
        endIndex: number,
        line: TextLine,
    ): string {
        if (!type) {
            this.previousBracketColor = this.settings.orphanColor;
            return this.settings.orphanColor;
        }
        const token = new Token(type, character, depth, beginIndex, line);
        if (this.colorIndexes.isClosingPairForCurrentStack(type, depth)) {
            return this.getCloseBracketColor(token);
        }
        return this.getOpenBracketColor(token);
    }

    private cloneCharStack() {
        const clone = new Map<string, string[]>();
        this.charStack.forEach((value, key) => {
            clone.set(key, value.slice());
        });
        return clone;
    }

    private getOpenBracketColor(token: Token): string {
        let colorIndex: number;

        if (this.settings.forceIterationColorCycle) {
            colorIndex = (this.colorIndexes.getPreviousIndex(token.type) + 1) % this.settings.colors.length;
        }
        else {
            colorIndex = this.colorIndexes.getCurrentLength(token.type) % this.settings.colors.length;
        }

        let color = this.settings.colors[colorIndex];

        if (this.settings.forceUniqueOpeningColor && color === this.previousBracketColor) {
            colorIndex = (colorIndex + 1) % this.settings.colors.length;
            color = this.settings.colors[colorIndex];
        }

        this.previousBracketColor = color;
        this.colorIndexes.setCurrent(token, colorIndex);

        return color;
    };

    private getCloseBracketColor(token: Token): string {
        const colorIndex = this.colorIndexes.getCurrentColorIndex(token);
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
