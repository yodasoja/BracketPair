import * as vscode from "vscode";
import BracketPair from "./bracketPair";
import ColorMode from "./colorMode";

export default class Settings {
    public readonly timeOutLength: number;
    public readonly forceUniqueOpeningColor: boolean;
    public readonly forceIterationColorCycle: boolean;
    public readonly colorizeComments: boolean;
    public readonly bracketPairs: BracketPair[] = [];
    public readonly regexPattern: string;
    public readonly decorations: Map<string, vscode.TextEditorDecorationType>;
    public readonly colorMode: ColorMode;

    constructor(
        timeOutLength?: number,
        forceUniqueOpeningColor?: boolean,
        forceIterationColorCycle?: boolean,
        colorizeComments?: boolean,
        colorMode?: ColorMode,
        consecutiveSettings?: [{}],
        independentSettings?: [[{}]],
    ) {
        const configuration = vscode.workspace.getConfiguration();

        this.forceUniqueOpeningColor = forceUniqueOpeningColor !== undefined ?
            forceUniqueOpeningColor : configuration.get("bracketPairColorizer.forceUniqueOpeningColor") as boolean;

        this.forceIterationColorCycle = forceIterationColorCycle !== undefined ?
            forceIterationColorCycle : configuration.get("bracketPairColorizer.forceIterationColorCycle") as boolean;

        this.colorizeComments = colorizeComments !== undefined ?
            colorizeComments : configuration.get("bracketPairColorizer.colorizeComments") as boolean;

        this.colorMode = colorMode !== undefined ?
            colorMode : (ColorMode as any)[configuration.get("bracketPairColorizer.colorMode") as string];

        this.timeOutLength = timeOutLength !== undefined ?
            timeOutLength : configuration.get("bracketPairColorizer.timeOut") as number;

        if (this.colorMode === ColorMode.Consecutive) {
            consecutiveSettings = consecutiveSettings !== undefined ?
                consecutiveSettings : configuration.get("bracketPairColorizer.consecutivePairColors") as [{}];

            const orphanColor = consecutiveSettings.pop() as string;

            const colors = consecutiveSettings.pop() as [string];

            consecutiveSettings.forEach((value) => {
                const brackets = value as string;
                this.bracketPairs.push(new BracketPair(brackets[0], brackets[1], colors, orphanColor));
            });
        }
        else {
            independentSettings = independentSettings !== undefined ?
                independentSettings : configuration.get("bracketPairColorizer.independentPairColors") as [[{}]];

            independentSettings.forEach((setting, index) => {

                const brackets = setting[0] as string;

                const colors = setting[1] as string[];

                const orphanColor = setting[2] as string;

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

        for (const bracketPair of bracketPairs) {
            regex += `\\${bracketPair.openCharacter}\\${bracketPair.closeCharacter}`;
        }

        regex += "]";

        return regex;
    }

    private createDecorations(bracketPairs: BracketPair[]): Map<string, vscode.TextEditorDecorationType> {
        const decorations = new Map<string, vscode.TextEditorDecorationType>();

        for (const bracketPair of bracketPairs) {
            for (const color of bracketPair.colors) {
                const decoration = vscode.window.createTextEditorDecorationType({ color });
                decorations.set(color, decoration);
            }

            const errorDecoration = vscode.window.createTextEditorDecorationType({ color: bracketPair.orphanColor });
            decorations.set(bracketPair.orphanColor, errorDecoration);
        }

        return decorations;
    }
}
