import * as vscode from "vscode";
import BracketPair from "./bracketPair";

interface IColorIndex {
    getPreviousIndex(bracketPair: BracketPair): number;
    setCurrent(bracketPair: BracketPair, range: vscode.Range, colorIndex: number): void;
    getCurrentLength(bracketPair: BracketPair): number;
    popCurrent(bracketPair: BracketPair, range: vscode.Range): number | undefined;
    clone(): IColorIndex;
}

export default IColorIndex;
