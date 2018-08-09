import { Position, Range } from "vscode";
import Bracket from "./bracket";
import BracketPair from "./bracketPair";
import Scope from "./scope";;

interface IColorIndex {
    getPreviousIndex(type: string): number;
    setCurrent(type: string, depth: number, range: Range, colorIndex: number): void;
    getCurrentLength(type: string): number;
    getCurrentColorIndex(type: string, depth: number, range: Range): number | undefined;
    getScope(position: Position): Scope | undefined;
    getOpenBrackets(): Set<string>;
    isClosingPairForCurrentStack(type: string, depth: number): boolean;
    clone(): IColorIndex;
}

export default IColorIndex;
