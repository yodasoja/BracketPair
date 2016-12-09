'use strict';
import BracketPair from "./bracketPair";

interface ColorIndex
{
    getPrevious(bracketPair: BracketPair): number;
    setPrevious(bracketPair: BracketPair, colorIndex: number): void;
    setCurrent(bracketPair: BracketPair, colorIndex: number): void;
    getCurrentLength(bracketPair: BracketPair): number;
    popCurrent(bracketPair: BracketPair): number | undefined;
    clone() : ColorIndex;
}

export default ColorIndex;