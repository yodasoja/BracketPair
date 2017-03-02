import * as vscode from "vscode";
import LineState from "./lineState";
import Match from "./match";
import ModifierPair from "./modifierPair";
import Settings from "./settings";

export default class TextLine {
    public colorRanges = new Map<string, vscode.Range[]>();
    public readonly index: number;
    private lastModifierCheckPos = 0;
    private lineState: LineState;
    private readonly settings: Settings;
    private readonly scopeChecker: Match;

    constructor(settings: Settings, index: number, document: vscode.TextDocument, lineState?: LineState) {
        this.settings = settings;
        this.scopeChecker = new Match(document.lineAt(index).text);
        this.index = index;
        if (lineState !== undefined) {
            this.lineState = lineState;
        }
        else {
            this.lineState = new LineState(settings);
        }
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    public cloneState() {
        // Update state for whole line before returning
        this.checkForStringModifiers(this.scopeChecker.content.length);
        return this.lineState.clone();
    }

    public addBracket(bracket: string, position: number) {
        if (this.settings.contextualParsing) {
            this.checkForStringModifiers(position, bracket);
            if (this.lineState.activeScope) {
                return;
            }
        }

        const bracketOpenPosition = new vscode.Position(this.index, position);
        const bracketClosePosition = new vscode.Position(this.index, position + bracket.length);
        const range = new vscode.Range(
            bracketOpenPosition,
            bracketClosePosition,
        );

        for (const bracketPair of this.settings.bracketPairs) {
            if (bracketPair.openCharacter === bracket) {
                const color = this.lineState.getOpenBracketColor(bracketPair, range);

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
                const color = this.lineState.getCloseBracketColor(bracketPair, range);

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

    private checkForStringModifiers(bracketPosition: number, bracket: string = ""): void {
        for (let i = this.lastModifierCheckPos; i < bracketPosition; i++) {
            // If in a scope, check for closing characters
            if (this.lineState.activeScope) {
                // Unless in a scope that continues until end of line
                if (this.lineState.activeScope.isSingleLineComment()) {
                    return;
                }

                if (this.lineState.activeScope.closer) {
                    if (this.scopeChecker.contains(i, this.lineState.activeScope.closer)) {
                        this.lineState.activeScope = undefined;
                    }
                }
                else {
                    throw new Error("Closing character is undefined in multiline block");
                }
            }
            else {
                this.checkForOpeningScope(i);
            }
        }
        this.lastModifierCheckPos = bracketPosition + bracket.length;
    }

    private checkForOpeningScope(position: number) {
        for (const scope of this.settings.scopes) {
            if (this.scopeChecker.contains(position, scope.opener)) {
                this.lineState.activeScope = scope;
                return;
            }
        }
    }
}
