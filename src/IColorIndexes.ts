import { Position, } from "vscode";
import Scope from "./scope";import TextLine from "./textLine";
;

interface IColorIndex {
    getPreviousIndex(type: string): number;
    setCurrent(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine, colorIndex: number): void;
    getCurrentLength(type: string): number;
    getCurrentColorIndex(type: string, depth: number, beginIndex: number, endIndex: number, line: TextLine): number | undefined;
    getScope(position: Position): Scope | undefined;
    getOpenBrackets(): Set<string>;
    isClosingPairForCurrentStack(type: string, depth: number): boolean;
    clone(): IColorIndex;
}

export default IColorIndex;
