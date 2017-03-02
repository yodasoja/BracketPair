import * as vscode from "vscode";
import LineState from "./lineState";
import Match from "./match";
import ModifierPair from "./modifierPair";
import Settings from "./settings";

export default class TextLine {
    public colorRanges = new Map<string, vscode.Range[]>();
    public readonly index: number;
    private lastModifierCheckPos = -1;
    private lineState: LineState;
    private readonly settings: Settings;
    private readonly match: Match;

    constructor(settings: Settings, index: number, document: vscode.TextDocument, lineState?: LineState) {
        this.settings = settings;
        this.match = new Match(document.lineAt(index).text);
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
        this.checkForStringModifiers(this.match.content.length - 1);
        return this.lineState.clone();
    }

    public addBracket(bracket: string, position: number) {
        if (this.settings.contextualParsing) {
            this.checkForStringModifiers(position, bracket);
            if (this.lineState.activeScope) {
                return;
            }
        }

        const range = new vscode.Range(
            new vscode.Position(this.index, position),
            new vscode.Position(this.index, position + bracket.length),
        );

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

    private checkForStringModifiers(position: number, bracket: string = ""): void {
        if (this.lineState.activeScope) {
            if (!this.lineState.activeScope.isSingleLineComment()) {
                if (this.lineState.activeScope.closer) {
                    if (this.match.isMatched(position, this.lineState.activeScope.closer)) {
                        this.lastModifierCheckPos = position + bracket.length;
                        this.lineState.activeScope = undefined;
                    }
                }
            }
            return;
        }

        for (let i = this.lastModifierCheckPos; i < position; i++) {
            for (const scope of this.settings.scopes) {
                if (this.match.isMatched(position, scope.opener)) {
                    this.lastModifierCheckPos = position + bracket.length;
                    this.lineState.activeScope = scope;
                    return;
                }
            }
        }
    }
}
