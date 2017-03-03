import * as vscode from "vscode";
import Bracket from "./bracket";

export default class Scope {
    public readonly open: Bracket;
    public readonly close: Bracket;
    public readonly range: vscode.Range;
    public readonly color: string;
    constructor(range: vscode.Range, color: string, open: Bracket, close: Bracket) {
        this.range = range;
        this.color = color;
        this.open = open;
        this.close = close;
    }
}
