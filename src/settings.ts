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
        else {
            supportedLanguageID = false;
        }

        const configuration = vscode.workspace.getConfiguration();

        this.forceUniqueOpeningColor = settings.forceUniqueOpeningColor !== undefined ?
            settings.forceUniqueOpeningColor :
            configuration.get("bracketPairColorizer.forceUniqueOpeningColor") as boolean;

        this.forceIterationColorCycle = settings.forceIterationColorCycle !== undefined ?
            settings.forceIterationColorCycle :
            configuration.get("bracketPairColorizer.forceIterationColorCycle") as boolean;

        if (supportedLanguageID) {
            this.contextualParsing = settings.contextualParsing !== undefined ?
                settings.contextualParsing : configuration.get("bracketPairColorizer.contextualParsing") as boolean;
        }
        else {
            this.contextualParsing = false;
        }

        this.colorMode = settings.colorMode !== undefined ?
            settings.colorMode :
            (ColorMode as any)[configuration.get("bracketPairColorizer.colorMode") as string];

        this.timeOutLength = settings.timeOutLength !== undefined ?
            settings.timeOutLength :
            configuration.get("bracketPairColorizer.timeOut") as number;

        if (this.colorMode === ColorMode.Consecutive) {
            const consecutiveSettings = (settings.consecutiveSettings !== undefined ?
                settings.consecutiveSettings :
                (configuration.get("bracketPairColorizer.consecutivePairColors") as [{}])).slice();

            const orphanColor = consecutiveSettings.pop() as string;

            const colors = consecutiveSettings.pop() as [string];

            consecutiveSettings.forEach((value) => {
                const brackets = value as string;
                this.bracketPairs.push(new BracketPair(brackets[0], brackets[1], colors, orphanColor));
            });
        }
        else {
            const independentSettings = settings.independentSettings !== undefined ?
                settings.independentSettings :
                configuration.get("bracketPairColorizer.independentPairColors") as [[{}]];

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
