import * as vscode from "vscode";
import LineState from "./lineState";
import Settings from "./settings";

export default class TextLine {
    public colorRanges = new Map<string, vscode.Range[]>();
    private lastModifierCheckPos = 0;
    private lineState: LineState;
    private isComment = false;
    private readonly settings: Settings;
    private readonly contents: string;

    constructor(settings: Settings, index: number, document: vscode.TextDocument, bracketState?: LineState) {
        this.settings = settings;
        this.contents = document.lineAt(index).text;

        if (bracketState !== undefined) {
            this.lineState = bracketState;
        }
        else {
            this.lineState = new LineState(settings);
        }
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    public cloneState() {
        // Update state for whole line before returning
        this.checkBackwardsForStringModifiers(this.contents.length);
        return this.lineState.clone();
    }

    public addBracket(bracket: string, range: vscode.Range) {
        this.checkBackwardsForStringModifiers(range.start.character);

        if (!this.settings.colorizeComments) {
            if (this.isComment ||
                this.lineState.isMultilineCommented()) {
                return;
            }
        }

        if (!this.settings.colorizeQuotes) {
            if (this.lineState.isQuoted()) {
                return;
            }
        }

        for (const bracketPair of this.settings.bracketPairs) {
            if (bracketPair.openCharacter === bracket) {
                const color = this.lineState.getOpenBracketColor(bracketPair);

                const colorRanges = this.colorRanges.get(color);

                if (colorRanges !== undefined) {
                    colorRanges.push(range);
                }
                else {
                    this.colorRanges.set(color, [range]);
                }
                return;
            }
            else if (bracketPair.closeCharacter === bracket) {
                const color = this.lineState.getCloseBracketColor(bracketPair);

                const colorRanges = this.colorRanges.get(color);
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

    private checkBackwardsForStringModifiers(startPos: number): void {
        for (let i = startPos - 1; i >= this.lastModifierCheckPos; i--) {
            // Double line comments consume everything else
            if (!this.settings.colorizeComments && this.isComment) {
                break;
            }

            // If its multi-line commented, check for end of multiline
            if (!this.settings.colorizeComments && this.lineState.multilineModifiers > 0) {
                if (this.contents[i] === "*" && this.contents[i + 1] === "/") {
                    this.lineState.multilineModifiers--;
                }
                continue;
            }

            // If single quotes open, only check for closing quotes
            if (!this.settings.colorizeQuotes && this.lineState.singleQuoteModifiers > 0) {
                if (this.contents[i] === "'" && (i === 0 || this.contents[i - 1] !== "\\")) {
                    this.lineState.singleQuoteModifiers--;
                }
                continue;
            }

            // If double quotes open, only check for closing quotes
            if (!this.settings.colorizeQuotes && this.lineState.doubleQuoteModifiers > 0) {
                if (this.contents[i] === "\"" && (i === 0 || this.contents[i - 1] !== "\\")) {
                    this.lineState.doubleQuoteModifiers--;
                }
                continue;
            }

            // If backtick quotes open, only check for closing quotes
            if (!this.settings.colorizeQuotes && this.lineState.backTickModifiers > 0) {
                if (this.contents[i] === "`" && (i === 0 || this.contents[i - 1] !== "\\")) {
                    this.lineState.backTickModifiers--;
                }
                continue;
            }

            // Else check for opening modifiers
            if (!this.settings.colorizeQuotes && this.contents[i] === "'" &&
                (i === 0 || this.contents[i - 1] !== "\\")) {
                this.lineState.singleQuoteModifiers++;
                continue;
            }

            if (!this.settings.colorizeQuotes && this.contents[i] === "\"" &&
                (i === 0 || this.contents[i - 1] !== "\\")) {
                this.lineState.doubleQuoteModifiers++;
                continue;
            }

            if (!this.settings.colorizeQuotes && this.contents[i] === "`" &&
                (i === 0 || this.contents[i - 1] !== "\\")) {
                this.lineState.backTickModifiers++;
                continue;
            }

            if (!this.settings.colorizeComments && this.contents[i] === "/") {
                if (this.contents[i + 1] === "/") {
                    this.isComment = true;
                    continue;
                }

                if (this.contents[i + 1] === "*") {
                    this.lineState.multilineModifiers++;
                    continue;
                }
            }
        }
        this.lastModifierCheckPos = startPos;
    }
}
