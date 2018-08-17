import { Position, Range } from "vscode";
import Bracket from "./bracket";
import BracketPointer from "./bracketPointer";
import BracketClose from "./bracketClose";
import ColorIndexes from "./IColorIndexes";
import Settings from "./settings";
import Token from "./token";

export default class MultipleIndexes implements ColorIndexes {
    private openBracketStack = new Map<string, BracketPointer[]>();
    private closedBrackets: BracketClose[] = [];
    private allBrackets: BracketClose[] = [];
    private previousOpenBracketColorIndexes = new Map<string, number[]>();
    private readonly settings: Settings;

    constructor(
        settings: Settings,
        previousState?: {
            currentOpenBracketColorIndexes: Map<string, BracketPointer[]>,
            previousOpenBracketColorIndexes: Map<string, number[]>,
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.openBracketStack = previousState.currentOpenBracketColorIndexes;
            this.previousOpenBracketColorIndexes = previousState.previousOpenBracketColorIndexes;
        }
    }

    public getOpenBracketStack() {
        return this.openBracketStack;
    }

    public getPreviousIndex(type: string): number {
        return this.previousOpenBracketColorIndexes[type];
    }

    public isClosingPairForCurrentStack(type: string, depth: number): boolean {
        const bracketStack = this.openBracketStack.get(type);

        if (bracketStack && bracketStack.length > 0) {
            const topStack = bracketStack[bracketStack.length - 1].bracket;
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
        const openBracketPointer = openStack.pop();

        if (!openBracketPointer) {
            return;
        }

        const closeBracket = new BracketClose(token, openBracketPointer);
        this.closedBrackets.push(closeBracket);

        return openBracketPointer.bracket.colorIndex;
    }

    public getClosingBracket(position: Position): BracketClose | undefined {
        for (const closeBracket of this.closedBrackets) {
            const openBracket = closeBracket.openBracketPointer.bracket;
            const startPosition = new Position(openBracket.token.line.index,
                openBracket.token.beginIndex + openBracket.token.character.length);
            const endPosition = new Position(closeBracket.token.line.index, closeBracket.token.beginIndex);
            const range = new Range(startPosition, endPosition);

            if (range.contains(position)) {
                return closeBracket;
            }
        }
    }

    public copyCumulativeState(): ColorIndexes {
        return new MultipleIndexes(
            this.settings,
            {
                currentOpenBracketColorIndexes: new Map(this.openBracketStack),
                previousOpenBracketColorIndexes: new Map(this.previousOpenBracketColorIndexes),
            });
    }
}
