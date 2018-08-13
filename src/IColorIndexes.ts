import { Position } from "vscode";
import Bracket from "./bracket";
import Token from "./token";

interface IColorIndex {
    getPreviousIndex(type: string): number;
    setCurrent(token: Token, colorIndex: number): void;
    getCurrentLength(type: string): number;
    getCurrentColorIndex(token: Token): number | undefined;
    getEndScopeBracket(position: Position): Bracket | undefined;
    isClosingPairForCurrentStack(type: string, depth: number): boolean;
    clone(): IColorIndex;
}

export default IColorIndex;
