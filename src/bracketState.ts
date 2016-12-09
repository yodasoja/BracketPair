'use strict';

import BracketPair from "./bracketPair";

interface BracketState {
    deepCopy(): BracketState;
    getColor(bracketPair: BracketPair): string;
    popColor(bracketPair: BracketPair): string;
}

export default BracketState;