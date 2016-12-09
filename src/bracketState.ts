'use strict';

import BracketPair from "./bracketPair";

interface BracketState {
    deepCopy(): BracketState;
    getColor(bracketPair: BracketPair): string;
    popColor(bracketPair: BracketPair): string;

    // Should be private
    _getPreviousColorIndex(bracketPair : BracketPair) : number;
    _setPreviousColorIndex(bracketPair : BracketPair, colorIndex : number) : void;
    _getCurrentColorIndex(bracketPair : BracketPair) : number;
    _setCurrentColorIndex(bracketPair : BracketPair, colorIndex : number) : void;
    _getAmountOfOpenBrackets(bracketPair : BracketPair) : number;
}

export default BracketState;