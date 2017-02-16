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
        this.checkForStringModifiers();
        return this.lineState.CloneMultiLineState();
    }

    public addBracket(bracket: string, range: vscode.Range) {
        this.checkForStringModifiers(range);

        if (!this.settings.colorizeComments) {
            if (this.lineState.isConsumedByCommentModifier || this.lineState.isMultiLineCommented()) {
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

    private checkForStringModifiers(range?: vscode.Range): void {
        let incrementAmount = 1;
        const bracketStartIndex = range !== undefined ? range.start.character : this.contents.length;
        const bracketEndIndex = range !== undefined ? range.end.character : this.contents.length;

        for (let i = this.lastModifierCheckPos; i < bracketStartIndex; i += incrementAmount) {
            incrementAmount = 1;
            // Single line comments consume everything else
            if (!this.settings.colorizeComments && this.lineState.isConsumedByCommentModifier) {
                break;
            }

            // We are in a scope, search for closing modifiers
            if (!this.settings.colorizeComments && this.lineState.isMultiLineCommented()) {
                let found = false;
                for (const modifier of this.lineState.multiLineState.commentModifiers) {
                    if (!found && modifier.counter > 0) {
                        const searchResult = this.contents.substr(i, modifier.closingCharacter.length);
                        if (searchResult === modifier.closingCharacter) {
                            found = true;
                            incrementAmount = searchResult.length;
                            modifier.counter--;
                        }
                    }
                }
                continue;
            }

            if (!this.settings.colorizeQuotes && this.lineState.isQuoted()) {
                let found = false;
                for (const modifier of this.lineState.multiLineState.quoteModifiers) {
                    if (!found && modifier.counter > 0) {
                        const searchResult = this.contents.substr(i, modifier.closingCharacter.length);
                        if (searchResult === modifier.closingCharacter) {
                            found = true;
                            incrementAmount = searchResult.length;
                            modifier.counter--;
                        }
                    }
                }
                continue;
            }

            // Else we are not in a scope, search for opening modifiers
            if (!this.settings.colorizeQuotes) {
                let found = false;
                for (const modifier of this.lineState.multiLineState.quoteModifiers) {
                    if (!found) {
                        const searchResult = this.contents.substr(i, modifier.openingCharacter.length);
                        if (searchResult ===
                            modifier.openingCharacter &&
                            !this.isEscaped(i)) {
                            found = true;
                            incrementAmount = modifier.openingCharacter.length;
                            modifier.counter++;
                        }
                    }
                }

                if (found) {
                    continue;
                }
            }

            if (!this.settings.colorizeComments) {
                let found = false;
                for (const modifier of this.lineState.multiLineState.commentModifiers) {
                    if (!found) {
                        const searchResult = this.contents.substr(i, modifier.openingCharacter.length);
                        if (searchResult ===
                            modifier.openingCharacter &&
                            !this.isEscaped(i)) {
                            found = true;
                            incrementAmount = modifier.openingCharacter.length;
                            modifier.counter++;
                        }
                    }
                }

                if (found) {
                    continue;
                }
            }

            if (!this.settings.colorizeComments) {
                let found = false;
                for (const modifier of this.settings.singleCommentModifiers) {
                    const searchResult = this.contents.substring(i, modifier.length);
                    if (!found && searchResult === modifier) {
                        found = true;
                        this.lineState.isConsumedByCommentModifier = true;
                    }
                }
                continue;
            }
        }
        this.lastModifierCheckPos = bracketEndIndex;
    }
}
