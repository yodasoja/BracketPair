import { Position, Range } from "vscode";
import LineState from "./lineState";
import Scope from "./scope";

export default class TextLine {
    public colorRanges = new Map<string, Range[]>();
    public readonly index: number;
    private lineState: LineState;
    private readonly ruleStack: any;

    constructor(
        index: number,
        ruleStack: any,
        lineState: LineState) {
        this.index = index;
        this.lineState = lineState;
        this.ruleStack = ruleStack;
    }

    public getRuleStack(): any {
        return this.ruleStack;
    }

    public getCharStack() {
        return this.lineState.getCharStack();
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    public cloneState() {
        return this.lineState.cloneState();
    }

    public addScope(type: string | undefined, depth: number, beginIndex: number, endIndex: number): void {
        const range = new Range(new Position(this.index, beginIndex), new Position(this.index, endIndex));

        if (type) {
            const startSplitIndex = type.indexOf(".begin.");
            if (startSplitIndex !== -1) {
                type = type.substring(0, startSplitIndex);
            }
            else {
                const endSplitIndex = type.indexOf(".end.");
                if (endSplitIndex !== -1) {
                    type = type.substring(0, endSplitIndex);
                }
            }
        }

        return this.setColorRange(type, depth, range);
    }
    public getScope(position: Position): Scope | undefined {
        return this.lineState.getScope(position);
    }

    private setColorRange(type: string | undefined, depth: number, range: Range) {
        const color = this.lineState.getBracketColor(type, depth, range);

        const colorRanges = this.colorRanges.get(color);
        if (colorRanges !== undefined) {
            colorRanges.push(range);
        }
        else {
            this.colorRanges.set(color, [range]);
        }
        return;
    }
}
