'use strict';

import BracketPair from "./bracketPair";
import Settings from "./settings";
import ColorIndexes from "./colorIndexes";
import ColorMode from './colorMode';
import SingularIndex from './singularIndex';
import MultipleIndexes from './MultipleIndexes';
import * as assert from 'assert';

export default class BracketState {
    protected readonly settings: Settings;
    protected previousBracketColor = "";
    protected colorIndexes: ColorIndexes;

    constructor(settings: Settings, colorIndexes?: ColorIndexes, previousBracketColor?: string) {
        this.settings = settings;

        // TODO Optional values are tightly coupled, should be all or nothing. Find a better way of doing this.
        assert((
            previousBracketColor !== undefined &&
            colorIndexes !== undefined)
            ||
            (previousBracketColor === undefined &&
                colorIndexes === undefined));

        if (previousBracketColor !== undefined) {
            this.previousBracketColor = previousBracketColor;
        }

        if (colorIndexes !== undefined) {
            this.colorIndexes = colorIndexes;
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

    public deepCopy() {
        return new BracketState(this.settings, this.colorIndexes.deepCopy(), this.previousBracketColor);
    }
}