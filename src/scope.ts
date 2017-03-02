import * as vscode from "vscode";

export default class Scope {
    public readonly range: vscode.Range;
    public readonly color: string;
    constructor(range: vscode.Range, color: string) {
        this.range = range;
        this.color = color;
    }
}
