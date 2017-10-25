import { Position, Range } from "vscode";
import LineState from "./lineState";
import Match from "./match";
import ModifierPair from "./modifierPair";
import Scope from "./scope";
import ScopeCharacter from "./scopeCharacter";
import ScopePattern from "./scopePattern";
import Settings from "./settings";

export default class TextLine {
    public colorRanges = new Map<string, Range[]>();
    public readonly index: number;
    private resumeLineCheckPosition = 0;
    private lineState: LineState;
    private scopeEndPosition = -1;
    private readonly settings: Settings;
    private readonly content: string;

    constructor(content: string, settings: Settings, index: number, lineState?: LineState) {
        this.settings = settings;
        this.content = content;
        this.index = index;
        if (lineState !== undefined) {
            this.lineState = lineState;
        }
        else {
            this.lineState = new LineState(settings);
        }
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    public copyMultilineContext() {
        // Update state for whole line before returning
        this.updateScopes(this.content.length);
        return this.lineState.copyMultilineContext();
    }

    public getScope(position: Position): Scope | undefined {
        return this.lineState.getScope(position);
    }

    public addBracket(bracket: string, position: number) {
        if (this.settings.contextualParsing) {
            if (position <= this.scopeEndPosition) {
                return;
            }

            this.updateScopes(position, bracket);

            // Check again now scope is updated
            if (position <= this.scopeEndPosition) {
                return;
            }
        }

        const bracketOpenPosition = new Position(this.index, position);
        const bracketClosePosition = new Position(this.index, position + bracket.length);
        const range = new Range(
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

    private updateScopes(bracketPosition: number, bracket: string = ""): void {
        // We don't want to color brackets inside a scope, so if a scope opener is encoutered, we mark where it ends
        // If it doesn't end in this line, its marked as infinity
        for (let i = this.resumeLineCheckPosition; i <= bracketPosition; i++) {

            let checkPos = i;

            if (!this.lineState.activeScope) {
                this.lineState.activeScope = this.getOpeningScope(i);
                if (this.lineState.activeScope) {
                    checkPos = i + this.lineState.activeScope.opener.match.length;
                }
            }

            const scope = this.lineState.activeScope;

            if (scope) {
                if (scope.closer) {
                    this.scopeEndPosition = this.getClosingScopePosition(checkPos, scope.closer);
                    if (this.scopeEndPosition !== Infinity) {
                        // If closer & Infinity keep scope alive so it gets analyzed next line
                        this.lineState.activeScope = null;
                    }
                }
                else {
                    this.scopeEndPosition = Infinity;
                }

                i = this.scopeEndPosition;
            }
        }

        this.resumeLineCheckPosition = Math.max(bracketPosition + bracket.length - 1, this.scopeEndPosition) + 1;
    }

    private getClosingScopePosition(index: number, character: ScopeCharacter): number {
        for (let i = index; i < this.content.length; i++) {
            if (Match.contains(this.content, i, character)) {
                return i + character.match.length - 1;
            }
        }

        return Infinity;
    }

    private getOpeningScope(position: number): ScopePattern | null {
        for (const scope of this.settings.scopes) {
            if (Match.contains(this.content, position, scope.opener)) {
                return scope;
            }
        }
        return null;
    }
}
