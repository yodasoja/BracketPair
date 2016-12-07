'use string';

import * as vscode from 'vscode';
import * as assert from 'assert';
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

        this.forceUniqueOpeningColor = forceUniqueOpeningColor ?
            forceUniqueOpeningColor : configuration.get("bracketPairColorizer.forceUniqueOpeningColor") as boolean;

        this.forceIterationColorCycle = forceIterationColorCycle ?
            forceIterationColorCycle : configuration.get("bracketPairColorizer.forceIterationColorCycle") as boolean;

        this.colorMode = colorMode ? colorMode : (<any>ColorMode)[configuration.get("bracketPairColorizer.colorMode") as string];

        this.timeOutLength = timeOutLength ? timeOutLength : configuration.get("bracketPairColorizer.timeOut") as number;

        if (this.colorMode === ColorMode.Consecutive) {
            consecutiveSettings = consecutiveSettings
                ? consecutiveSettings : configuration.get("bracketPairColorizer.consecutivePairColors") as [{}];

            assert(consecutiveSettings.length >= 3, "consecutiveSettings does not have any brackets specified");

            let orphanColor = consecutiveSettings.pop() as string;
            assert(orphanColor && orphanColor.length > 0, "User defined orphan color must not be empty");

            let colors = consecutiveSettings.pop() as [string];
            assert(colors && colors.length > 0, "User defined bracket colors must not be empty");

            consecutiveSettings.forEach((value, index) => {
                let brackets = value as string;
                assert(brackets.length === 2, "User defined consecutive brackets [" + index + "] must be two characters");
                this.bracketPairs.push(new BracketPair(brackets[0], brackets[1], colors, orphanColor));
            });
        }
        else {
            independentSettings = independentSettings
                ? independentSettings : configuration.get("bracketPairColorizer.independentPairColors") as [[{}]];

            independentSettings.forEach((setting, index) => {
                assert(setting.length === 3, "independentSetting [" + index + "] does not have 3 elements");

                let brackets = setting[0] as string;
                assert(brackets.length === 2, "User defined brackets must be two characters");

                let colors = setting[1] as string[];
                assert(colors.length > 0, "User defined bracket colors must not be empty");

                let orphanColor = setting[2] as string;
                assert(orphanColor.length > 0, "User defined orphan color must not be empty");

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