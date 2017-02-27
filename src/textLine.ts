import * as vscode from "vscode";
import LineState from "./lineState";
import ModifierPair from "./modifierPair";
import MultiLineState from "./multiLineState";
import Settings from "./settings";

export default class TextLine {
    public colorRanges = new Map<string, vscode.Range[]>();
    public readonly index: number;
    private lastModifierCheckPos = 0;
    private lineState: LineState;
    private readonly settings: Settings;
    private readonly contents: string;

    constructor(settings: Settings, index: number, document: vscode.TextDocument, multiLineState?: MultiLineState) {
        this.settings = settings;
        this.contents = document.lineAt(index).text;
        this.index = index;
        if (multiLineState !== undefined) {
            this.lineState = new LineState(settings, multiLineState);;
        }
        else {
            this.lineState = new LineState(settings);
        }
    }

    public getFirstPositionBefore(position: vscode.Position): vscode.Position | undefined {
        let limit = position.character;
        let foundPos = -1;

        if (this.index < position.line) {
            limit = Infinity;
        }

        let found = false;

        this.colorRanges.forEach((ranges) => {
            ranges.forEach((range) => {
                if (range.end.character < limit) {
                    foundPos = Math.max(foundPos, range.end.character);
                    found = true;
                }
            });
        });

        if (!found) {
            return undefined;
        }

        return new vscode.Position(this.index, foundPos);
    }

    public getFirstPositionAfter(position: vscode.Position): vscode.Position | undefined {
        let limit = position.character;
        let foundPos = Infinity;

        if (this.index > position.line) {
            limit = -1;
        }

        let found = false;

        this.colorRanges.forEach((ranges) => {
            ranges.forEach((range) => {
                if (range.start.character > limit) {
                    foundPos = Math.min(range.start.character, foundPos);
                    found = true;
                }
            });
        });

        if (!found) {
            return undefined;
        }

        return new vscode.Position(this.index, foundPos);
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    public cloneState() {
        // Update state for whole line before returning
        this.checkForStringModifiers();
        return this.lineState.CloneMultiLineState();
    }

    public addBracket(bracket: string, range: vscode.Range) {
        if (this.settings.contextualParsing) {
            this.checkForStringModifiers(range);
            if (this.lineState.isLineCommented || this.lineState.isMultiLineCommented() || this.lineState.isQuoted()) {
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
            if (this.lineState.isLineCommented) {
                break;
            }

            // We are in a scope, search for closing modifiers
            // These checks should not fallthrough
            if (this.lineState.isMultiLineCommented()) {
                const result = this.checkClosingPairModifier(i, this.lineState.multiLineState.blockCommentModifiers);

                if (result !== undefined) {
                    i += result;
                }
                continue;
            }

            if (this.lineState.isQuoted()) {
                const result = this.checkClosingPairModifier(i, this.lineState.multiLineState.quoteModifiers);

                if (result !== undefined) {
                    i += result;
                }
                continue;
            }

            // Else we are not in a scope, search for opening modifiers
            // These checks fallthrough if unsuccessful
            {
                const result = this.checkOpeningPairModifier(i, this.lineState.multiLineState.quoteModifiers);

                if (result !== undefined) {
                    i += result;
                    continue;
                }
            }

            {
                const result = this.checkOpeningPairModifier(i, this.lineState.multiLineState.blockCommentModifiers);

                if (result !== undefined) {
                    i += result;
                    continue;
                }
            }

            {
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
