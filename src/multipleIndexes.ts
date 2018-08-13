import {Position} from "vscode";
import Bracket from "./bracket";
import ColorIndexes from "./IColorIndexes";
import Settings from "./settings";
import Token from "./token";

export default class MultipleIndexes implements ColorIndexes {
    private openBracketStack = new Map<string, Bracket[]>();
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
            this.openBracketStack = previousState.currentOpenBracketColorIndexes;
            this.previousOpenBracketColorIndexes = previousState.previousOpenBracketColorIndexes;
        }
    }

    public getPreviousIndex(type: string): number {
        return this.previousOpenBracketColorIndexes[type];
    }

    public isClosingPairForCurrentStack(type: string, depth: number): boolean {
        const bracketStack = this.openBracketStack.get(type);

        if (bracketStack && bracketStack.length > 0) {
            const topStack = bracketStack[bracketStack.length - 1];
            return topStack.token.depth === depth;
        }
        else {
            return false;
        }
    }

    public setCurrent(token: Token, colorIndex: number) {
        const openBracket = new Bracket(token, colorIndex, this.settings.colors[colorIndex]);
        this.openBracketStack[token.type].push(openBracket);
        this.previousOpenBracketColorIndexes[token.type] = colorIndex;
    }

    public getCurrentLength(type: string): number {
        return this.openBracketStack[type].length;
    }

    public getCurrentColorIndex(token: Token): number | undefined {
        const openStack = this.openBracketStack.get(token.type);

        if (!openStack) {
            return;
        }
        const openBracket = openStack.pop();

        if (!openBracket) {
            return;
        }

        const closeBracket = new Bracket(token, openBracket.colorIndex, openBracket.color);
        this.closedBrackets.push(closeBracket);
        openBracket.pair = closeBracket;
        closeBracket.pair = openBracket;

        return openBracket.colorIndex;
    }

    public getEndScopeBracket(position: Position): Bracket | undefined {
        for (const bracket of this.closedBrackets) {
            // If closing bracket is after index
            if (bracket.token.line.index > position.line ||
                bracket.token.beginIndex >= position.character) {
                const openBracket = bracket.pair!;
                // And opening bracket is before index
                if (openBracket.token.line.index < position.line ||
                    openBracket.token.endIndex <= position.character) {
                    return bracket;
                }
            }
        }
    }


    public clone(): ColorIndexes {
        return new MultipleIndexes(
            this.settings,
            {
                currentOpenBracketColorIndexes: new Map(this.openBracketStack),
                previousOpenBracketColorIndexes: new Map(this.previousOpenBracketColorIndexes),
            });
    }
}
