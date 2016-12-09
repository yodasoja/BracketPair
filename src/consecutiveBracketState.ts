'use strict';
import BracketState from './bracketState';
import Settings from "./settings";
import BracketPair from "./bracketPair";
import * as assert from 'assert';

export default class ConsecutiveBracketState implements BracketState {
    private readonly settings: Settings;
    private bracketColorIndexes: number[] = [];
    private lastColorIndex: number = -1;
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
            this.lastColorIndex = lastColorIndex;
        }

        if (bracketColorIndexes !== undefined) {
            this.bracketColorIndexes = bracketColorIndexes;
        }

        if (previousBracketColor !== undefined) {
            this.previousBracketColor = previousBracketColor;
        }
    }

    deepCopy(): BracketState {
        return new ConsecutiveBracketState(
            this.settings,
            this.lastColorIndex,
            this.bracketColorIndexes.slice(),
            this.previousBracketColor);
    }

    getColor(bracketPair: BracketPair): string {
        let colorIndex: number;

        if (this.settings.forceIterationColorCycle) {
            colorIndex = (this.lastColorIndex + 1) % bracketPair.colors.length;
        }
        else {
            colorIndex = this.bracketColorIndexes.length % bracketPair.colors.length;
        }

        let color = bracketPair.colors[colorIndex];

        if (this.settings.forceUniqueOpeningColor && color === this.previousBracketColor) {
            colorIndex = (colorIndex + 1) % bracketPair.colors.length;
            color = bracketPair.colors[colorIndex];
        }
        this.previousBracketColor = color;

        this.bracketColorIndexes.push(colorIndex);
        this.lastColorIndex = colorIndex;

        return color;
    };

    popColor(bracketPair: BracketPair): string {
        let colorIndex = this.bracketColorIndexes.pop();
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