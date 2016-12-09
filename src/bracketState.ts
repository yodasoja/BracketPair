'use strict';

import BracketPair from "./bracketPair";
import Settings from "./settings";


abstract class BracketState {
    protected readonly settings: Settings;
    protected previousBracketColor = "";

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract deepCopy(): BracketState;

    protected abstract getPreviousColorIndex(bracketPair: BracketPair): number;
    protected abstract setPreviousColorIndex(bracketPair: BracketPair, colorIndex: number): void;
    protected abstract getCurrentColorIndex(bracketPair: BracketPair): number;
    protected abstract setCurrentColorIndex(bracketPair: BracketPair, colorIndex: number): void;
    protected abstract getAmountOfOpenBrackets(bracketPair: BracketPair): number;
    protected abstract popCurrentColorIndex(bracketPair: BracketPair): number | undefined;

    public getOpenBracketColor(bracketPair: BracketPair): string {
        let colorIndex: number;

        if (this.settings.forceIterationColorCycle) {
            colorIndex = (this.getPreviousColorIndex(bracketPair) + 1) % bracketPair.colors.length;
        }
        else {
            colorIndex = this.getAmountOfOpenBrackets(bracketPair) % bracketPair.colors.length;
        }

        let color = bracketPair.colors[colorIndex];

        if (this.settings.forceUniqueOpeningColor && color === this.previousBracketColor) {
            colorIndex = (colorIndex + 1) % bracketPair.colors.length;
            color = bracketPair.colors[colorIndex];
        }
        this.previousBracketColor = color;

        this.setCurrentColorIndex(bracketPair, colorIndex);
        this.setPreviousColorIndex(bracketPair, colorIndex);

        return color;
    };

    public getCloseBracketColor(bracketPair: BracketPair): string {
        let colorIndex = this.popCurrentColorIndex(bracketPair);
        let color: string;
        if (colorIndex !== undefined) {
            color = bracketPair.colors[colorIndex];
        }
        else {
            color = bracketPair.orphanColor;
        }

        this.previousBracketColor = color;
        return color;
    }
}

export default BracketState;