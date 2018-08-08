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

    public addScope(shortId: string, longId: string, beginIndex: number, endIndex: number): void {
        const range = new Range(new Position(this.index, beginIndex), new Position(this.index, endIndex));
        const startSplitIndex = shortId.indexOf(".begin.");
        if (startSplitIndex !== -1) {
            return this.setOpenRange(shortId.substring(0, startSplitIndex), range);
        }

        const endSplitIndex = shortId.indexOf(".end.");
        if (endSplitIndex !== -1) {
            return this.setCloseRange(shortId.substring(0, endSplitIndex), range);
        }
    }
    public getScope(position: Position): Scope | undefined {
        return this.lineState.getScope(position);
    }

    private setOpenRange(type: string, range: Range) {
        const color = this.lineState.getOpenBracketColor(type, range);

        const colorRanges = this.colorRanges.get(color);
        if (colorRanges !== undefined) {
            colorRanges.push(range);
        }
        else {
            this.colorRanges.set(color, [range]);
        }
        return;
    }

    private setCloseRange(type: string, range: Range) {
        const color = this.lineState.getCloseBracketColor(type, range);

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
