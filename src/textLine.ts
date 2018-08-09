import { Position, Range } from "vscode";
import FoundBracket from "./foundBracket";
import LineState from "./lineState";
import ModifierPair from "./modifierPair";
import Scope from "./scope";
import Settings from "./settings";

export default class TextLine {
    public colorRanges = new Map<string, Range[]>();
    public readonly index: number;
    private lineState: LineState;
    private readonly settings: Settings;
    private readonly ruleStack: any;

    constructor(settings: Settings, index: number, ruleStack?: any, lineState?: LineState) {
        this.settings = settings;
        this.index = index;
        this.ruleStack = ruleStack;
        if (lineState !== undefined) {
            this.lineState = lineState;
        }
        else {
            this.lineState = new LineState(settings);
        }
    }

    public getRuleStack(): any {
        return this.ruleStack;
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    public copyMultilineContext() {
        return this.lineState.copyMultilineContext();
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
