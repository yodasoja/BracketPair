'use strict';

import BracketPair from "./bracketPair";
import Settings from "./settings";
import ColorIndexes from "./colorIndexes";
import ColorMode from './colorMode';
import SingularIndex from './singularIndex';
import MultipleIndexes from './MultipleIndexes';

export default class BracketState {
    protected readonly settings: Settings;
    protected previousBracketColor = "";
    protected colorIndexes: ColorIndexes;

    constructor(
        settings: Settings,
        previousState?: {
            colorIndexes: ColorIndexes,
            bracketColor: string
        }) {
        this.settings = settings;

        if (previousState !== undefined) {
            this.previousBracketColor = previousState.bracketColor;
            this.colorIndexes = previousState.colorIndexes;
        }
        else {
            switch (settings.colorMode) {
                case ColorMode.Consecutive: this.colorIndexes = new SingularIndex();
                    break;
                case ColorMode.Independent: this.colorIndexes = new MultipleIndexes(settings);
                    break;
                default: throw new RangeError("Not implemented enum value");
            }
        }
    }

    public getOpenBracketColor(bracketPair: BracketPair): string {
        let colorIndex: number;

        if (this.settings.forceIterationColorCycle) {
            colorIndex = (this.colorIndexes.getPrevious(bracketPair) + 1) % bracketPair.colors.length;
        }
        else {
            colorIndex = this.colorIndexes.getCurrentLength(bracketPair) % bracketPair.colors.length;
        }

        let color = bracketPair.colors[colorIndex];

        if (this.settings.forceUniqueOpeningColor && color === this.previousBracketColor) {
            colorIndex = (colorIndex + 1) % bracketPair.colors.length;
            color = bracketPair.colors[colorIndex];
        }

        this.previousBracketColor = color;
        this.colorIndexes.setCurrent(bracketPair, colorIndex);
        this.colorIndexes.setPrevious(bracketPair, colorIndex);

        return color;
    };

    public getCloseBracketColor(bracketPair: BracketPair): string {
        let colorIndex = this.colorIndexes.popCurrent(bracketPair);
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

    public clone() {
        return new BracketState(
            this.settings,
            {
                colorIndexes: this.colorIndexes.deepCopy(),
                bracketColor: this.previousBracketColor
            });
    }
}