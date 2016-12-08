'use string';

import * as vscode from 'vscode';
import BracketPair from "./bracketPair";
import ColorMode from './colorMode';

export default class Settings {
    readonly timeOutLength: number;
    readonly forceUniqueOpeningColor: boolean;
    readonly forceIterationColorCycle: boolean;
    readonly bracketPairs: BracketPair[] = [];
    readonly regexPattern: string;
    readonly decorations: Map<string, vscode.TextEditorDecorationType>;
    readonly colorMode: ColorMode;

    constructor(
        timeOutLength?: number,
        forceUniqueOpeningColor?: boolean,
        forceIterationColorCycle?: boolean,
        colorMode?: ColorMode,
        consecutiveSettings?: [{}],
        independentSettings?: [[{}]]
    ) {
        let configuration = vscode.workspace.getConfiguration();

        this.forceUniqueOpeningColor = forceUniqueOpeningColor !== undefined ?
            forceUniqueOpeningColor : configuration.get("bracketPairColorizer.forceUniqueOpeningColor") as boolean;

        this.forceIterationColorCycle = forceIterationColorCycle !== undefined ?
            forceIterationColorCycle : configuration.get("bracketPairColorizer.forceIterationColorCycle") as boolean;

        this.colorMode = colorMode !== undefined ?
            colorMode : (<any>ColorMode)[configuration.get("bracketPairColorizer.colorMode") as string];

        this.timeOutLength = timeOutLength !== undefined ?
            timeOutLength : configuration.get("bracketPairColorizer.timeOut") as number;

        if (this.colorMode === ColorMode.Consecutive) {
            consecutiveSettings = consecutiveSettings !== undefined ?
                consecutiveSettings : configuration.get("bracketPairColorizer.consecutivePairColors") as [{}];

            let orphanColor = consecutiveSettings.pop() as string;

            let colors = consecutiveSettings.pop() as [string];

            consecutiveSettings.forEach(value => {
                let brackets = value as string;
                this.bracketPairs.push(new BracketPair(brackets[0], brackets[1], colors, orphanColor));
            });
        }
        else {
            independentSettings = independentSettings !== undefined ?
                independentSettings : configuration.get("bracketPairColorizer.independentPairColors") as [[{}]];

            independentSettings.forEach((setting, index) => {

                let brackets = setting[0] as string;

                let colors = setting[1] as string[];

                let orphanColor = setting[2] as string;

                this.bracketPairs.push(new BracketPair(brackets[0], brackets[1], colors, orphanColor));
            });
        }

        this.regexPattern = this.createRegex(this.bracketPairs);
        this.decorations = this.createDecorations(this.bracketPairs);
    }

    // Create a regex to match open and close brackets
    // TODO Test what happens if user specifies other characters then []{}()
    private createRegex(bracketPairs: BracketPair[]): string {
        let regex = "[";

        for (let bracketPair of bracketPairs) {
            regex += `\\${bracketPair.openCharacter}\\${bracketPair.closeCharacter}`;
        }

        regex += "]";

        return regex;
    }

    private createDecorations(bracketPairs: BracketPair[]): Map<string, vscode.TextEditorDecorationType> {
        let decorations = new Map<string, vscode.TextEditorDecorationType>();

        for (let bracketPair of bracketPairs) {
            for (let color of bracketPair.colors) {
                let decoration = vscode.window.createTextEditorDecorationType({ color: color });
                decorations.set(color, decoration);
            }

            let errorDecoration = vscode.window.createTextEditorDecorationType({ color: bracketPair.orphanColor });
            decorations.set(bracketPair.orphanColor, errorDecoration);
        }

        return decorations;
    }
}