'use strict';

export default class BracketPair {
    
    readonly openCharacter: string;
    readonly closeCharacter: string;
    readonly colors : string[];
    readonly orphanColor: string;

    constructor(firstBracket: string, lastBracket: string, colors: string[], orphanColor : string) {
        this.openCharacter = firstBracket;
        this.closeCharacter = lastBracket;
        this.colors = colors;
        this.orphanColor = orphanColor;
    }
}