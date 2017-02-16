import * as vscode from "vscode";
import LineState from "./lineState";
import MultiLineState from "./multiLineState";
import Settings from "./settings";

export default class TextLine {
    public colorRanges = new Map<string, vscode.Range[]>();
    private lastModifierCheckPos = 0;
    private lineState: LineState;
    private readonly settings: Settings;
    private readonly contents: string;

    constructor(settings: Settings, index: number, document: vscode.TextDocument, multiLineState?: MultiLineState) {
        this.settings = settings;
        this.contents = document.lineAt(index).text;

        if (multiLineState !== undefined) {
            this.lineState = new LineState(settings, multiLineState);;
        }
        else {
            this.lineState = new LineState(settings);
        }
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    public cloneState() {
        // Update state for whole line before returning
        this.checkForStringModifiers(this.contents.length);
        return this.lineState.CloneMultiLineState();
    }

    public addBracket(bracket: string, range: vscode.Range) {
        this.checkForStringModifiers(range.start.character);

        if (!this.settings.colorizeComments) {
            if (this.lineState.isComment || this.lineState.isMultiLineCommented()) {
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

    private isEscaped(index: number): boolean {
        let counter = 0;
        while (index > 0 && this.contents[--index] === "\\") {
            counter++;
        }

        return counter % 2 === 1;
    }

    private checkForStringModifiers(endPos: number): void {
        for (let i = this.lastModifierCheckPos; i < endPos; i++) {
            // Double line comments consume everything else
            if (!this.settings.colorizeComments && this.lineState.isComment) {
                break;
            }

            // We are in a scope, search for closing modifiers
            if (!this.settings.colorizeComments && this.lineState.isMultiLineCommented()) {
                let found = false;
                this.lineState.multiLineState.commentModifiers.forEach((modifier) => {
                    if (!found && modifier.counter > 0) {
                        const searchValue = modifier.closingCharacter;
                        const foundIndex = this.contents.substring(i, endPos).indexOf(searchValue);
                        if (foundIndex !== -1) {
                            found = true;
                            i = foundIndex;
                            modifier.counter--;
                        }
                    }
                });
                continue;
            }

            if (!this.settings.colorizeQuotes && this.lineState.isQuoted()) {
                let found = false;
                this.lineState.multiLineState.quoteModifiers.forEach((modifier) => {
                    if (!found && modifier.counter > 0) {
                        const searchValue = modifier.closingCharacter;
                        const foundIndex = this.contents.substring(i, endPos).indexOf(searchValue);
                        if (foundIndex !== -1) {
                            found = true;
                            i = foundIndex;
                            modifier.counter--;
                        }
                    }
                });
                continue;
            }

            // Else we are not in a scope, search for opening modifiers
            if (!this.settings.colorizeQuotes) {
                let found = false;
                this.lineState.multiLineState.quoteModifiers.forEach((modifier) => {
                    if (!found && this.contents.substring(i, endPos) ===
                        modifier.openingCharacter &&
                        !this.isEscaped(i)) {
                        found = true;
                        modifier.counter++;
                    }
                });

                if (found) {
                    continue;
                }
            }

            if (!this.settings.colorizeComments) {
                let found = false;
                this.lineState.multiLineState.commentModifiers.forEach((modifier) => {
                    if (!found && this.contents.substring(i, endPos) ===
                        modifier.openingCharacter &&
                        !this.isEscaped(i)) {
                        found = true;
                        modifier.counter++;
                    }
                });

                if (found) {
                    continue;
                }
            }
        }
        this.lastModifierCheckPos = endPos;
    }
}
