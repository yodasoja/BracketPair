'use strict';
import BracketState from './bracketState';
import Settings from "./settings";
import BracketPair from "./bracketPair";
import * as assert from 'assert';

export default class ConsecutiveBracketState implements BracketState {
    private readonly settings: Settings;
    private currentOpenBracketColorIndexes: number[] = [];
    private previousOpenBracketColorIndex: number = -1;
    private previousBracketColor = "";

    constructor(
        settings: Settings,
        lastColorIndex?: number,
        bracketColorIndexes?: number[],
        previousBracketColor?: string) {

        // TODO Optional values are tightly coupled, should be all or nothing. Find a better way of doing this.
        assert((lastColorIndex !== undefined &&
            bracketColorIndexes !== undefined &&
            previousBracketColor !== undefined)
            ||
            ((lastColorIndex === undefined &&
                bracketColorIndexes === undefined &&
                previousBracketColor === undefined)));

        this.settings = settings;

        if (lastColorIndex !== undefined) {
            this.previousOpenBracketColorIndex = lastColorIndex;
        }

        if (bracketColorIndexes !== undefined) {
            this.currentOpenBracketColorIndexes = bracketColorIndexes;
        }

        if (previousBracketColor !== undefined) {
            this.previousBracketColor = previousBracketColor;
        }
    }

    deepCopy(): BracketState {
        return new ConsecutiveBracketState(
            this.settings,
            this.previousOpenBracketColorIndex,
            this.currentOpenBracketColorIndexes.slice(),
            this.previousBracketColor);
    }

    getColor(bracketPair: BracketPair): string {
        let colorIndex: number;

        if (this.settings.forceIterationColorCycle) {
            colorIndex = (this._getPreviousColorIndex(bracketPair) + 1) % bracketPair.colors.length;
        }
        else {
            colorIndex = this._getAmountOfOpenBrackets(bracketPair) % bracketPair.colors.length;
        }

        let color = bracketPair.colors[colorIndex];

        if (this.settings.forceUniqueOpeningColor && color === this.previousBracketColor) {
            colorIndex = (colorIndex + 1) % bracketPair.colors.length;
            color = bracketPair.colors[colorIndex];
        }
        this.previousBracketColor = color;

        this._setCurrentColorIndex(bracketPair, colorIndex);
        this._setPreviousColorIndex(bracketPair, colorIndex);

        return color;
    };

    popColor(bracketPair: BracketPair): string {
        let colorIndex = this.currentOpenBracketColorIndexes.pop();
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

    _setPreviousColorIndex(bracketPair: BracketPair, colorIndex: number) {
        this.previousOpenBracketColorIndex = colorIndex;
    }

    _getPreviousColorIndex(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndex;
    }

    _setCurrentColorIndex(bracketPair: BracketPair, colorIndex: number) {
        this.currentOpenBracketColorIndexes.push(colorIndex);
    }

    _getCurrentColorIndex(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[this.currentOpenBracketColorIndexes.length - 1];
    }

    _getAmountOfOpenBrackets(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes.length;
    }
}