import BracketPair from "./bracketPair";

interface IColorIndex {
    getPrevious(bracketPair: BracketPair): number;
    setCurrent(bracketPair: BracketPair, colorIndex: number): void;
    getCurrentLength(bracketPair: BracketPair): number;
    popCurrent(bracketPair: BracketPair): number | undefined;
    clone(): IColorIndex;
}

export default IColorIndex;
