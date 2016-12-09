'use strict';

import * as vscode from 'vscode';
import Settings from "./settings";
import LineState from './lineState';

export default class TextLine {
    private lineState: LineState;
    colorRanges = new Map<string, vscode.Range[]>();
    private readonly settings: Settings;

    constructor(settings: Settings, bracketState?: LineState) {
        this.settings = settings;

        if (bracketState !== undefined) {
            this.lineState = bracketState;
        }
        else {
            this.lineState = new LineState(settings);
        }
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    clone(): TextLine {
        return new TextLine(this.settings, this.lineState.clone());
    }

    addBracket(bracket: string, range: vscode.Range) {
        for (let bracketPair of this.settings.bracketPairs) {
            if (bracketPair.openCharacter === bracket) {
                let color = this.lineState.getOpenBracketColor(bracketPair);

                let colorRanges = this.colorRanges.get(color);

                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }
                return;
            }
            else if (bracketPair.closeCharacter === bracket) {
                let color = this.lineState.getCloseBracketColor(bracketPair);

                let colorRanges = this.colorRanges.get(color);
                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }
                return;
            }
        }
    }
}