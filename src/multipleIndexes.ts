import { Position, Range } from "vscode";
import Bracket from "./bracket";
import BracketPair from "./bracketPair";
import ColorIndexes from "./IColorIndexes";
import Scope from "./scope";
import Settings from "./settings";
import TextLine from "./textLine";
import Token from "./token";

export default class MultipleIndexes implements ColorIndexes {
    private openBrackets = new Map<string, Bracket[]>();
    private closedBrackets: Bracket[] = [];
    private previousOpenBracketColorIndexes = new Map<string, number[]>();
    private readonly settings: Settings;

    constructor(
        settings: Settings,
        previousState?: {
            currentOpenBracketColorIndexes: Map<string, Bracket[]>,
            previousOpenBracketColorIndexes: Map<string, number[]>,
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.openBrackets = previousState.currentOpenBracketColorIndexes;
            this.previousOpenBracketColorIndexes = previousState.previousOpenBracketColorIndexes;
        }
    }

    public getPreviousIndex(type: string): number {
        return this.previousOpenBracketColorIndexes[type];
    }

    public isClosingPairForCurrentStack(type: string, depth: number): boolean {
        const bracketStack = this.openBrackets.get(type);

        if (bracketStack && bracketStack.length > 0) {
            const topStack = bracketStack[bracketStack.length - 1];
            return topStack.token.depth === depth;
        }
        else {
            return false;
        }
    }

    public setCurrent(token: Token, colorIndex: number) {
        const openBracket = new Bracket(token, colorIndex);
        this.openBrackets[token.type].push(openBracket);
        this.previousOpenBracketColorIndexes[token.type] = colorIndex;
    }

    public getCurrentLength(type: string): number {
        return this.openBrackets[type].length;
    }

    public getCurrentColorIndex(token: Token): number | undefined {
        const openStack = this.openBrackets.get(token.type);

        if (!openStack) {
            return;
        }
        const openBracket = openStack.pop();

        if (!openBracket) {
            return;
        }

        const closeBracket = new Bracket(token, openBracket.colorIndex);
        this.closedBrackets.push(closeBracket);
        openBracket.pair = closeBracket;
        closeBracket.pair = openBracket;

        return openBracket.colorIndex;
    }

    public getEndScopeBracket(charIndex: number): Bracket | undefined {
        let previousBracket: Bracket | undefined;
        for (const bracket of this.closedBrackets) {
            // If closing bracket is after index
            if (bracket.token.beginIndex > charIndex) {
                // And opening bracket is before index
                if (bracket.pair!.token.endIndex < charIndex) {
                    previousBracket = bracket;
                }
            }
            else {
                break;
            }
        }

        return previousBracket;
    }

    public clone(): ColorIndexes {
        return new MultipleIndexes(
            this.settings,
            {
                currentOpenBracketColorIndexes: new Map(this.openBrackets),
                previousOpenBracketColorIndexes: new Map(this.previousOpenBracketColorIndexes),
            });
    }
}
