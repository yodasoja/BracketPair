'use strict';
import BracketState from './bracketState';
import Settings from "./settings";
import BracketPair from "./bracketPair";
import * as assert from 'assert';

export default class IndependentBracketState implements BracketState {
    private readonly settings: Settings;
    private currentOpenBracketColorIndexes: { [character: string]: number[]; } = {};
    private previousOpenBracketColorIndexes: { [character: string]: number; } = {};
    private previousBracketColor = "";

    constructor(
        settings: Settings,
        bracketColorIndexes?: { [character: string]: number[]; },
        previousOpenBracketIndexes?: { [character: string]: number; },
        previousBracketColor?: string) {

        // TODO Optional values are tightly coupled, should be all or nothing. Find a better way of doing this.
        assert((
            bracketColorIndexes !== undefined &&
            previousOpenBracketIndexes !== undefined &&
            previousBracketColor !== undefined)
            ||
            (
                bracketColorIndexes === undefined &&
                previousOpenBracketIndexes === undefined &&
                previousBracketColor === undefined));

        this.settings = settings;

        if (bracketColorIndexes !== undefined) {
            this.currentOpenBracketColorIndexes = bracketColorIndexes;
        }
        else {
            this.settings.bracketPairs.forEach(bracketPair => {
                this.currentOpenBracketColorIndexes[bracketPair.openCharacter] = [];
            });
        }

        if (previousOpenBracketIndexes !== undefined) {
            this.previousOpenBracketColorIndexes = previousOpenBracketIndexes;
        }
        else {
            this.settings.bracketPairs.forEach(bracketPair => {
                this.previousOpenBracketColorIndexes[bracketPair.openCharacter] = -1;
            });
        }

        if (previousBracketColor !== undefined) {
            this.previousBracketColor = previousBracketColor;
        }
    }

    deepCopy(): BracketState {
        let bracketColorIndexesCopy: { [character: string]: number[]; } = {};

        Object.keys(this.currentOpenBracketColorIndexes).forEach(key => {
            bracketColorIndexesCopy[key] = this.currentOpenBracketColorIndexes[key].slice();
        });

        let previousOpenBracketIndexesCopy: { [character: string]: number; } = {};

        Object.keys(this.previousOpenBracketColorIndexes).forEach(key => {
            previousOpenBracketIndexesCopy[key] = this.previousOpenBracketColorIndexes[key];
        });

        return new IndependentBracketState(
            this.settings,
            bracketColorIndexesCopy,
            previousOpenBracketIndexesCopy,
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
        let colorIndex = this.currentOpenBracketColorIndexes[bracketPair.openCharacter].pop();
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
        this.previousOpenBracketColorIndexes[bracketPair.openCharacter] = colorIndex;
    }

    _getPreviousColorIndex(bracketPair: BracketPair): number {
        return this.previousOpenBracketColorIndexes[bracketPair.openCharacter];
    }

    _setCurrentColorIndex(bracketPair: BracketPair, colorIndex: number) {
        this.currentOpenBracketColorIndexes[bracketPair.openCharacter].push(colorIndex);
    }

    _getCurrentColorIndex(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter][this.currentOpenBracketColorIndexes[bracketPair.openCharacter].length - 1];
    }

    _getAmountOfOpenBrackets(bracketPair: BracketPair): number {
        return this.currentOpenBracketColorIndexes[bracketPair.openCharacter].length;
    }

}