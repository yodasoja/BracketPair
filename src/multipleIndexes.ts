import { Position, Range } from "vscode";
import Bracket from "./bracket";
import BracketPair from "./bracketPair";
import ColorIndexes from "./IColorIndexes";
import Scope from "./scope";
import Settings from "./settings";
import TextLine from "./textLine";

export default class MultipleIndexes implements ColorIndexes {
    private openBrackets = new Map<string, Bracket[]>();
    private previousOpenBracketColorIndexes = new Map<string, number[]>();
    private bracketScopes: Scope[] = [];
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

    public getOpenBrackets() {
        const brackets = new Set<string>();
        Object.keys(this.openBrackets).forEach((key) => {
            if (this.openBrackets[key].length > 0) {
                brackets.add(key);
            }
        });

        return brackets;
    }

    public getPreviousIndex(type: string): number {
        return this.previousOpenBracketColorIndexes[type];
    }

    public isClosingPairForCurrentStack(type: string, depth: number): boolean {
        const bracketStack = this.openBrackets.get(type);

        if (bracketStack && bracketStack.length > 0) {
            const topStack = bracketStack[bracketStack.length - 1];
            return topStack.depth === depth;
        }
        else {
            return false;
        }
    }

    public setCurrent(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine, colorIndex: number) {
        this.openBrackets[type].push(new Bracket(type, depth, beginIndex, endIndex, line, colorIndex));
        this.previousOpenBracketColorIndexes[type] = colorIndex;
    }

    public getCurrentLength(type: string): number {
        return this.openBrackets[type].length;
    }

    public getCurrentColorIndex(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine): number | undefined {
        const openStack = this.openBrackets.get(type);

        if (!openStack) {
            return;
        }
        const openBracket = openStack.pop();

        if (!openBracket) {
            return;
        }

        const closeBracket = new Bracket(type, depth, beginIndex, endIndex, line, openBracket.colorIndex);
        openBracket.pair = closeBracket;
        closeBracket.pair = openBracket;

        return openBracket.colorIndex;
    }

    public getScope(position: Position): Scope | undefined {
        for (const scope of this.bracketScopes) {
            if (scope.range.contains(position)) {
                return scope;
            }
        }
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
