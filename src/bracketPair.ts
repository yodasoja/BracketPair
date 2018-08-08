import { Range } from "vscode";

export default class BracketPair {
    public readonly type: string;
    public readonly open: Range;
    public readonly close: Range;

    constructor(type: string, open: Range, close: Range) {
        this.type = type;
        this.open = open;
        this.close = close;
    }
}
