import { Range } from "vscode";
import TextLine from "./textLine";

export default class Bracket {
    public readonly character: string;
    public readonly depth: number;
    public readonly range: Range;
    public readonly beginIndex: number;
    public readonly endIndex: number;
    public readonly colorIndex: number;
    public readonly line: TextLine;
    public pair?: Bracket;

    constructor(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine, colorIndex: number) {
        this.character = type;
        this.line = line;
        this.depth = depth;
        this.beginIndex = beginIndex;
        this.endIndex = endIndex;
        this.colorIndex = colorIndex;
    }

    public stackMatch(bracket: Bracket) {
        return this.character === bracket.character && this.depth === bracket.depth;
    }
}
