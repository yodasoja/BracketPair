import * as vscode from "vscode";
import LineState from "./lineState";
import Settings from "./settings";

export default class TextLine {
    public colorRanges = new Map<string, vscode.Range[]>();
    private lastBracketPos = 0;
    private lineState: LineState;
    private readonly settings: Settings;
    private readonly contents: string;

    constructor(settings: Settings, contents: string, bracketState?: LineState) {
        this.settings = settings;
        this.contents = contents;

        if (bracketState !== undefined) {
            this.lineState = bracketState;
        }
        else {
            this.lineState = new LineState(settings);
        }
    }

    // Return a copy of the line while mantaining bracket state. colorRanges is not mantained.
    public cloneState() {
        return this.lineState.clone();
    }

    public addBracket(bracket: string, range: vscode.Range) {
        if (!this.settings.colorizeComments) {
            for (let i = range.start.character - 2; i >= this.lastBracketPos; i--) {
                if (this.contents[i] === "*" && this.contents[i + 1] === "/") {
                    this.lineState.isComment = false;
                    break;
                }
                if (this.contents[i] === "/" && (this.contents[i + 1] === "/" || this.contents[i + 1] === "*")) {
                    this.lineState.isComment = true;
                    return;
                }
            }

            if (this.lineState.isComment) {
                return;
            }
        }

        this.lastBracketPos = range.start.character;

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
}
