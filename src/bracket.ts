import * as vscode from "vscode";

export default class Bracket {
    public readonly range: vscode.Range;
    public readonly colorIndex: number;

    constructor(range: vscode.Range, colorIndex: number, pair?: Bracket) {
        this.range = range;
        this.colorIndex = colorIndex;
    }
}