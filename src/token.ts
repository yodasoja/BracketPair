import TextLine from "./textLine";

export default class Token {
    public readonly type: string;
    public readonly depth: number;
    public readonly beginIndex: number;
    public readonly endIndex: number;
    public readonly line: TextLine;

    constructor(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine) {
        this.type = type;
        this.depth = depth;
        this.beginIndex = beginIndex;
        this.endIndex = endIndex;
        this.line = line;
    }
}