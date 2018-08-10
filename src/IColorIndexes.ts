import { Position } from "vscode";
import Scope from "./scope"; import TextLine from "./textLine";
import Token from "./token";

interface IColorIndex {
    getPreviousIndex(type: string): number;
    setCurrent(token: Token, colorIndex: number): void;
    getCurrentLength(type: string): number;
    getCurrentColorIndex(token: Token): number | undefined;
    getScope(position: Position): Scope | undefined;
    isClosingPairForCurrentStack(type: string, depth: number): boolean;
    clone(): IColorIndex;
}

export default IColorIndex;
