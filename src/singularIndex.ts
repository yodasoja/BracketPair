import * as vscode from "vscode";
import Bracket from "./bracket";
import BracketPair from "./bracketPair";
import ColorIndexes from "./IColorIndexes";
import Scope from "./scope";
import Settings from "./settings";
import TextLine from "./textLine";
import Token from "./token";

export default class SingularIndex implements ColorIndexes {
    private openBrackets: Bracket[] = [];
    private closedBrackets: Bracket[] = [];
    private previousOpenBracketColorIndex: number = -1;
    private readonly settings: Settings;
    constructor(
        settings: Settings,
        previousState?: {
            currentOpenBracketColorIndexes: Bracket[],
            previousOpenBracketColorIndex: number,
        }) {

        this.settings = settings;

        if (previousState !== undefined) {
            this.openBrackets = previousState.currentOpenBracketColorIndexes;
            this.previousOpenBracketColorIndex = previousState.previousOpenBracketColorIndex;
        }
    }

    public getPreviousIndex(type: string): number {
        return this.previousOpenBracketColorIndex;
    }

    public isClosingPairForCurrentStack(type: string, depth: number): boolean {
        if (this.openBrackets.length === 0) {
            return false;
        }

        const topStack = this.openBrackets[this.openBrackets.length - 1];

        return topStack.token.type === type && topStack.token.depth === depth;
    }

    public setCurrent(token: Token, colorIndex: number) {
        this.openBrackets.push(new Bracket(token, colorIndex));
        this.previousOpenBracketColorIndex = colorIndex;
    }

    public getCurrentLength(type: string): number {
        return this.openBrackets.length;
    }

    public getCurrentColorIndex(token: Token): number | undefined {
        const openBracket = this.openBrackets.pop();
        if (openBracket) {
            const closeBracket = new Bracket(token, openBracket.colorIndex);
            openBracket.pair = closeBracket;
            closeBracket.pair = openBracket;
            this.closedBrackets.push(closeBracket);

            return openBracket.colorIndex;
        }
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

    public clone() {
        return new SingularIndex(
            this.settings,
            {
                currentOpenBracketColorIndexes: this.openBrackets.slice(),
                previousOpenBracketColorIndex: this.previousOpenBracketColorIndex,
            });
    }
}
