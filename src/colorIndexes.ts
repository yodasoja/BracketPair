'use strict';
import BracketPair from "./bracketPair";

interface ColorIndex
{
    getPrevious(bracketPair: BracketPair): number;
    setPrevious(bracketPair: BracketPair, colorIndex: number): void;
    getCurrent(bracketPair: BracketPair): number;
    setCurrent(bracketPair: BracketPair, colorIndex: number): void;
    getCurrentLength(bracketPair: BracketPair): number;
    popCurrent(bracketPair: BracketPair): number | undefined;
    deepCopy() : ColorIndex;
}

export default ColorIndex;