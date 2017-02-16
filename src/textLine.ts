import * as vscode from "vscode";
import LineState from "./lineState";
import ModifierPair from "./modifierPair";
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
            if (this.lineState.isLineCommented || this.lineState.isMultiLineCommented()) {
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

    private checkForStringModifiers(range?: vscode.Range): void {
        const bracketStartIndex = range !== undefined ? range.start.character : this.contents.length;
        const bracketEndIndex = range !== undefined ? range.end.character : this.contents.length;

        for (let i = this.lastModifierCheckPos; i < bracketStartIndex; i++) {
            // Single line comments consume everything else
            if (!this.settings.colorizeComments && this.lineState.isLineCommented) {
                break;
            }

            // We are in a scope, search for closing modifiers
            // These checks should not fallthrough
            if (!this.settings.colorizeComments && this.lineState.isMultiLineCommented()) {
                const result = this.checkClosingPairModifier(i, this.lineState.multiLineState.blockCommentModifiers);

                if (result !== undefined) {
                    i += result;
                }
                continue;
            }

            if (!this.settings.colorizeQuotes && this.lineState.isQuoted()) {
                const result = this.checkClosingPairModifier(i, this.lineState.multiLineState.quoteModifiers);

                if (result !== undefined) {
                    i += result;
                }
                continue;
            }

            // Else we are not in a scope, search for opening modifiers
            // These checks fallthrough if unsuccessful
            if (!this.settings.colorizeQuotes) {
                const result = this.checkOpeningPairModifier(i, this.lineState.multiLineState.quoteModifiers);

                if (result !== undefined) {
                    i += result;
                    continue;
                }
            }

            if (!this.settings.colorizeComments) {
                const result = this.checkOpeningPairModifier(i, this.lineState.multiLineState.blockCommentModifiers);

                if (result !== undefined) {
                    i += result;
                    continue;
                }
            }

            if (!this.settings.colorizeComments) {
                const result = this.checkOpeningSingleModifier(i, this.settings.singleCommentModifiers);

                if (result !== undefined) {
                    i += result;
                    continue;
                }
            }
        }

        this.lastModifierCheckPos = bracketEndIndex;
    }

    private checkOpeningSingleModifier(index: number, modifiers: string[]): number | undefined {
        for (const modifier of modifiers) {
            const searchResult = this.contents.substr(index, modifier.length);
            if (searchResult === modifier &&
                (modifier.length !== 1 || !this.isEscaped(index))) {
                this.lineState.isLineCommented = true;
                return modifier.length - 1;
            }
        }
    }

    private checkOpeningPairModifier(index: number, modifierPairs: ModifierPair[]): number | undefined {
        for (const modifier of modifierPairs) {
            const searchResult = this.contents.substr(index, modifier.openingCharacter.length);
            if (searchResult === modifier.openingCharacter &&
                (modifier.openingCharacter.length !== 1 || !this.isEscaped(index))) {
                modifier.counter++;
                return modifier.openingCharacter.length - 1;
            }
        }
    }

    private checkClosingPairModifier(index: number, modifierPairs: ModifierPair[]): number | undefined {
        for (const modifier of modifierPairs) {
            const searchResult = this.contents.substr(index, modifier.closingCharacter.length);
            if (searchResult === modifier.closingCharacter &&
                (modifier.closingCharacter.length !== 1 || !this.isEscaped(index))) {
                modifier.counter--;
                return modifier.closingCharacter.length - 1;
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
}
