'use strict';

import BracketPair from "./bracketPair";

interface BracketState {
    deepCopy(): BracketState;
    getColorIndex(bracketPair: BracketPair): number;
    setColorIndex(bracketPair: BracketPair, colorIndex: number): void;
    popColor(bracketPair: BracketPair): string;
}

export default BracketState;