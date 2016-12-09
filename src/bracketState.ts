'use strict';

import BracketPair from "./bracketPair"

interface BracketState {
    deepCopy(): BracketState;
    getColorIndex(bracketPair: BracketPair): number;
    setColorIndex(bracket: string, colorIndex: number): void;
    popColorIndex(bracket: string): number | undefined;
}

export default BracketState;