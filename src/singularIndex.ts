import * as vscode from "vscode";
import Bracket from "./bracket";
import BracketPair from "./bracketPair";
import ColorIndexes from "./IColorIndexes";
import Scope from "./scope";
import Settings from "./settings";
import TextLine from "./textLine";

export default class SingularIndex implements ColorIndexes {
    private openBrackets: Bracket[] = [];
    private brackets: Bracket[] = [];
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

    public getOpenBrackets() {
        return new Set<string>(this.openBrackets.map((e) => e.character));
    }

    public getPreviousIndex(type: string): number {
        return this.previousOpenBracketColorIndex;
    }

    public isClosingPairForCurrentStack(type: string, depth: number): boolean {
        if (this.openBrackets.length === 0) {
            return false;
        }

        const topStack = this.openBrackets[this.openBrackets.length - 1];

        return topStack.character === type && topStack.depth === depth;
    }

    public setCurrent(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine, colorIndex: number) {
        this.openBrackets.push(new Bracket(type, depth, beginIndex, endIndex, line, colorIndex));
        this.previousOpenBracketColorIndex = colorIndex;
    }

    public getCurrentLength(type: string): number {
        return this.openBrackets.length;
    }

    public getCurrentColorIndex(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine): number | undefined {
        const openBracket = this.openBrackets.pop();
        if (openBracket) {
            const closeBracket = new Bracket(type, depth, beginIndex, endIndex, line, openBracket.colorIndex);
            openBracket.pair = closeBracket;
            closeBracket.pair = openBracket;

            return openBracket.colorIndex;
        }
    }

    public getScope(position: vscode.Position): Scope | undefined {
        // for (const scope of this.bracketScopes) {
        //     if (scope.range.contains(position)) {
        //         return scope;
        //     }
        // }
        return;
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
