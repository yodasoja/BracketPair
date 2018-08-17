import { Position } from "vscode";
import BracketPointer from "./bracketPointer";
import BracketClose from "./bracketClose";
import Token from "./token";

interface IColorIndex {
    getPreviousIndex(type: string): number;
    setCurrent(token: Token, colorIndex: number): void;
    getCurrentLength(type: string): number;
    getCurrentColorIndex(token: Token): number | undefined;
    getClosingBracket(position: Position): BracketClose | undefined;
    getOpenBracketStack(): Map<string, BracketPointer[]> | BracketPointer[];
    isClosingPairForCurrentStack(type: string, depth: number): boolean;
    copyCumulativeState(): IColorIndex;
}

export default IColorIndex;
