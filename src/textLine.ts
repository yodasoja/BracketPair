import * as vscode from "vscode";
import LineState from "./lineState";
import Settings from "./settings";

export default class TextLine {
    public colorRanges = new Map<string, vscode.Range[]>();
    private lastBracketPos = 0;
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
        if (!this.settings.colorizeComments) {
            this.checkBackwardsForStringModifiers(range.start.character);
            this.lastBracketPos = range.start.character;

            if (this.isComment ||
                this.lineState.multilineModifiers !== 0 ||
                this.lineState.doubleQuoteModifiers !== 0 ||
                this.lineState.singleQuoteModifiers !== 0) {
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
        // If it's already commented, nothing can change
        if (this.isComment) {
            return;
        }

        for (let i = startPos - 1; i >= this.lastBracketPos; i--) {

            // If its multi-line commented, check for end of multiline
            if (this.lineState.multilineModifiers > 0) {
                if (this.contents[i] === "*" && this.contents[i + 1] === "/") {
                    this.lineState.multilineModifiers--;
                }
                continue;
            }

            // If single quotes open, only check for closing quotes
            if (this.lineState.singleQuoteModifiers > 0) {
                if (this.contents[i] === "'" && (i === 0 || this.contents[i - 1] !== "\\")) {
                    this.lineState.singleQuoteModifiers--;
                }
                continue;
            }

            // If double quotes open, only check for closing quotes
            if (this.lineState.doubleQuoteModifiers > 0) {
                if (this.contents[i] === "\"" && (i === 0 || this.contents[i - 1] !== "\\")) {
                    this.lineState.doubleQuoteModifiers--;
                }
                continue;
            }

            // Else check for opening modifiers
            if (this.contents[i] === "'" && (i === 0 || this.contents[i - 1] !== "\\")) {
                this.lineState.singleQuoteModifiers++;
                continue;
            }

            if (this.contents[i] === "\"" && (i === 0 || this.contents[i - 1] !== "\\")) {
                this.lineState.doubleQuoteModifiers++;
                continue;
            }

            if (this.contents[i] === "/") {
                if (this.contents[i + 1] === "/") {
                    this.isComment = true;
                    // Double line comments consume everything else
                    return;
                }

                if (this.contents[i + 1] === "*") {
                    this.lineState.multilineModifiers++;
                    continue;
                }
            }
        }
    }
}
