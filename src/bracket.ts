import { Range } from "vscode";

export default class Bracket {
    public readonly character: string;
    public readonly depth: number;
    public readonly range: Range;
    public readonly colorIndex: number;

    constructor(type: string, depth: number, range: Range, colorIndex: number, pair?: Bracket) {
        this.character = type;
        this.depth = depth;
        this.range = range;
        this.colorIndex = colorIndex;
    }

    public stackMatch(bracket: Bracket) {
        return this.character === bracket.character && this.depth === bracket.depth;
    }
}
