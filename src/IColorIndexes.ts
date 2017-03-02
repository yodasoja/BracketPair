import * as vscode from "vscode";
import Bracket from "./bracket";
import BracketPair from "./bracketPair";
import Scope from "./scope";

interface IColorIndex {
    getPreviousIndex(bracketPair: BracketPair): number;
    setCurrent(bracketPair: BracketPair, range: vscode.Range, colorIndex: number): void;
    getCurrentLength(bracketPair: BracketPair): number;
    getCurrentColorIndex(bracketPair: BracketPair, range: vscode.Range): number | undefined;
    getScope(position: vscode.Position): Scope | undefined;
    clone(): IColorIndex;
}

export default IColorIndex;
