import * as vscode from "vscode";
import BracketPair from "./bracketPair";
import ColorMode from "./colorMode";
import ModifierPair from "./modifierPair";

export default class Settings {
    public readonly timeOutLength: number;
    public readonly forceUniqueOpeningColor: boolean;
    public readonly forceIterationColorCycle: boolean;
    public readonly contextualParsing: boolean;
    public readonly bracketPairs: BracketPair[] = [];
    public readonly regexPattern: string;
    public readonly decorations: Map<string, vscode.TextEditorDecorationType>;
    public readonly colorMode: ColorMode;
    public readonly singleCommentModifiers: string[] = [];
    public blockCommentModifiers: ModifierPair[] = [];
    public quoteModifiers: ModifierPair[] = [];
    public isDisposed = false;

    constructor(settings: {
        languageID: string,
        timeOutLength?: number,
        forceUniqueOpeningColor?: boolean,
        forceIterationColorCycle?: boolean,
        contextualParsing?: boolean,
        colorMode?: ColorMode,
        consecutiveSettings?: [{}],
        independentSettings?: [[{}]],
    },
    ) {
        const hashTag = "#";
        const doubleQuote = "\"";
        const singleQuote = "'";
        const backtick = "`";
        const doubleSlash = "//";
        const slashBlockOpen = "/*";
        const slashBlockClose = "*/";
        const rubyBegin = "=begin";
        const rubyEnd = "=end";

        let supportedLanguageID = true;

        if (settings.languageID === "python") {
            this.singleCommentModifiers.push(hashTag);

            this.quoteModifiers.push(new ModifierPair(doubleQuote, doubleQuote));
            this.quoteModifiers.push(new ModifierPair(singleQuote, singleQuote));
        }
        else if (
            settings.languageID === "typescript" ||
            settings.languageID === "javascript") {
            this.singleCommentModifiers.push(doubleSlash);

            this.blockCommentModifiers.push(new ModifierPair(slashBlockOpen, slashBlockClose));

            this.quoteModifiers.push(new ModifierPair(backtick, backtick));
            this.quoteModifiers.push(new ModifierPair(doubleQuote, doubleQuote));
            this.quoteModifiers.push(new ModifierPair(singleQuote, singleQuote));
        }
        else if (
            settings.languageID === "c" ||
            settings.languageID === "cpp" ||
            settings.languageID === "csharp" ||
            settings.languageID === "java") {
            this.singleCommentModifiers.push(doubleSlash);

            this.blockCommentModifiers.push(new ModifierPair(slashBlockOpen, slashBlockClose));

            this.quoteModifiers.push(new ModifierPair(doubleQuote, doubleQuote));
            this.quoteModifiers.push(new ModifierPair(singleQuote, singleQuote));
        }
        else if (settings.languageID === "swift") {
            this.singleCommentModifiers.push(doubleSlash);

            this.blockCommentModifiers.push(new ModifierPair(slashBlockOpen, slashBlockClose));

            this.quoteModifiers.push(new ModifierPair(doubleQuote, doubleQuote));
        }
        else if (settings.languageID === "php") {
            this.singleCommentModifiers.push(doubleSlash);
            this.singleCommentModifiers.push(hashTag);

            this.blockCommentModifiers.push(new ModifierPair(slashBlockOpen, slashBlockClose));

            this.quoteModifiers.push(new ModifierPair(doubleQuote, doubleQuote));
            this.quoteModifiers.push(new ModifierPair(singleQuote, singleQuote));
        }
        else if (settings.languageID === "ruby") {
            this.singleCommentModifiers.push(hashTag);

            this.blockCommentModifiers.push(new ModifierPair(rubyBegin, rubyEnd));

            this.quoteModifiers.push(new ModifierPair(doubleQuote, doubleQuote));
            this.quoteModifiers.push(new ModifierPair(singleQuote, singleQuote));
        }
        else if (settings.languageID === "r") {
            this.singleCommentModifiers.push(hashTag);

            this.quoteModifiers.push(new ModifierPair(doubleQuote, doubleQuote));
            this.quoteModifiers.push(new ModifierPair(singleQuote, singleQuote));
        }
        else if (settings.languageID === "json") {
            this.singleCommentModifiers.push(doubleSlash);
            this.blockCommentModifiers.push(new ModifierPair(slashBlockOpen, slashBlockClose));
            this.quoteModifiers.push(new ModifierPair(doubleQuote, doubleQuote));
        }
        else {
            supportedLanguageID = false;
        }

        const configuration = vscode.workspace.getConfiguration();

        this.forceUniqueOpeningColor = settings.forceUniqueOpeningColor !== undefined ?
            settings.forceUniqueOpeningColor :
            configuration.get("bracketPairColorizer.forceUniqueOpeningColor") as boolean;

        if (typeof this.forceUniqueOpeningColor !== "boolean") {
            throw new Error("forceUniqueOpeningColor is not a boolean");
        }

        this.forceIterationColorCycle = settings.forceIterationColorCycle !== undefined ?
            settings.forceIterationColorCycle :
            configuration.get("bracketPairColorizer.forceIterationColorCycle") as boolean;

        if (typeof this.forceIterationColorCycle !== "boolean") {
            throw new Error("forceIterationColorCycle is not a boolean");
        }

        if (supportedLanguageID) {
            this.contextualParsing = settings.contextualParsing !== undefined ?
                settings.contextualParsing : configuration.get("bracketPairColorizer.contextualParsing") as boolean;
        }
        else {
            this.contextualParsing = false;
        }

        if (typeof this.contextualParsing !== "boolean") {
            throw new Error("contextualParsing is not a boolean");
        }

        this.colorMode = settings.colorMode !== undefined ?
            settings.colorMode :
            (ColorMode as any)[configuration.get("bracketPairColorizer.colorMode") as string];

        if (typeof this.colorMode !== "number") {
            throw new Error("colorMode enum could not be parsed");
        }

        this.timeOutLength = settings.timeOutLength !== undefined ?
            settings.timeOutLength :
            configuration.get("bracketPairColorizer.timeOut") as number;

        if (typeof this.timeOutLength !== "number") {
            throw new Error("timeOutLength was is a number");
        }

        if (this.colorMode === ColorMode.Consecutive) {
            const consecutiveSettings: [{}] = (settings.consecutiveSettings !== undefined ?
                settings.consecutiveSettings :
                configuration.get("bracketPairColorizer.consecutivePairColors") as [{}]);

            if (!Array.isArray(consecutiveSettings)) {
                throw new Error("consecutivePairColors is not an array");
            }

            if (consecutiveSettings.length < 3) {
                throw new Error("consecutivePairColors expected at least 3 parameters, actual: "
                    + consecutiveSettings.length);
            }

            const orphanColor = consecutiveSettings[consecutiveSettings.length - 1] as string;
            if (typeof orphanColor !== "string") {
                throw new Error("consecutivePairColors[" + (consecutiveSettings.length - 1) + "] is not a string");
            }

            const colors = consecutiveSettings[consecutiveSettings.length - 2] as string[];
            if (!Array.isArray(colors)) {
                throw new Error("consecutivePairColors[" + (consecutiveSettings.length - 2) + "] is not a string[]");
            }

            consecutiveSettings.slice(0, consecutiveSettings.length - 2).forEach((value, index) => {
                if (typeof value !== "string") {
                    throw new Error("consecutivePairColors[ " + index + "] is not a string");
                }
                const brackets = value;
                if (brackets.length < 2) {
                    throw new Error("consecutivePairColors[" + index + "] needs at least 2 characters");
                }
                this.bracketPairs.push(new BracketPair(brackets[0], brackets[1], colors, orphanColor));
            });
        }
        else {
            const independentSettings: [[{}]] = settings.independentSettings !== undefined ?
                settings.independentSettings :
                configuration.get("bracketPairColorizer.independentPairColors") as [[{}]];

            if (!Array.isArray(independentSettings)) {
                throw new Error("independentPairColors is not an array");
            }

            independentSettings.forEach((innerArray, index) => {
                if (!Array.isArray(innerArray)) {
                    throw new Error("independentPairColors[" + index + "] is not an array");
                }

                const brackets = innerArray[0] as string;
                if (typeof brackets !== "string") {
                    throw new Error("independentSettings[" + index + "][0] is not a string");
                }

                if (brackets.length < 2) {
                    throw new Error("independentSettings[" + index + "][0] needs at least 2 characters");
                }

                const colors = innerArray[1] as string[];
                if (!Array.isArray(colors)) {
                    throw new Error("independentSettings[" + index + "][1] is not string[]");
                }

                const orphanColor = innerArray[2] as string;
                if (typeof orphanColor !== "string") {
                    throw new Error("independentSettings[" + index + "][2] is not a string");
                }

                this.bracketPairs.push(new BracketPair(brackets[0], brackets[1], colors, orphanColor));
            });
        }

        this.regexPattern = this.createRegex(this.bracketPairs);
        this.decorations = this.createDecorations(this.bracketPairs);
    }

    public dispose() {
        this.decorations.forEach((decoration, key) => {
            decoration.dispose();
        });
        this.decorations.clear();
        this.isDisposed = true;
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
