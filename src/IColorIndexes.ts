import { Position, Range } from "vscode";
import Bracket from "./bracket";
import BracketPair from "./bracketPair";

interface IColorIndex {
    getPreviousIndex(bracketPair: BracketPair): number;
    setCurrent(bracketPair: BracketPair, range: Range, colorIndex: number): void;
    getCurrentLength(bracketPair: BracketPair): number;
    getCurrentColorIndex(bracketPair: BracketPair, range: Range): number | undefined;
    clone(): IColorIndex;
}

export default IColorIndex;
