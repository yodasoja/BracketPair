import { Position } from "vscode";
import Bracket from "./bracket";
import { IStackElement } from "./IExtensionGrammar";
import LineState from "./lineState";

export default class TextLine {
    public colorRanges = new Map<string, Array<{ beginIndex: number, endIndex: number }>>();
    public index: number;
    private lineState: LineState;
    private readonly ruleStack: IStackElement;

    constructor(
        ruleStack: IStackElement,
        lineState: LineState,
        index: number) {
        this.lineState = lineState;
        this.ruleStack = ruleStack;
        this.index = index;
    }

    public getRuleStack(): IStackElement {
        return this.ruleStack;
    }

    public getCharStack() {
        return this.lineState.getCharStack();
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    public cloneState() {
        return this.lineState.cloneState();
    }

    public addScope(type: string | undefined, character: string, depth: number, beginIndex: number, endIndex: number): void {
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

        return this.setColorRange(type, character, depth, beginIndex, endIndex);
    }
    public getEndScopeBracket(position: Position): Bracket | undefined {
        return this.lineState.getEndScopeBracket(position);
    }

    private setColorRange(type: string | undefined, character: string, depth: number, beginIndex: number, endIndex: number) {
        const color = this.lineState.getBracketColor(type, character, depth, beginIndex, endIndex, this);

        const colorRanges = this.colorRanges.get(color);
        if (colorRanges !== undefined) {
            colorRanges.push({ beginIndex, endIndex });
        }
        else {
            this.colorRanges.set(color, [{ beginIndex, endIndex }]);
        }
        return;
    }
}
