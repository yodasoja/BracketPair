import * as prism from "prismjs";
import * as vscode from "vscode";
import FoundBracket from "./foundBracket";
import Scope from "./scope";
import Settings from "./settings";
import TextLine from "./textLine";

export default class DocumentDecoration {
    public readonly settings: Settings;

    private updateDecorationTimeout: NodeJS.Timer | null;
    // This program caches lines, and will only analyze linenumbers including or above a modified line
    private lineToUpdateWhenTimeoutEnds = 0;
    private lines: TextLine[] = [];
    private readonly document: vscode.TextDocument;
    private updateScopeEvent: vscode.TextEditorSelectionChangeEvent | undefined;
    private readonly prismJs: any;
    // What have I created..
    private readonly stringStrategies = new Map<string,
        (token: prism.Token, lineIndex: number, charIndex: number, positions: FoundBracket[]) =>
            { lineIndex: number, charIndex: number }>();
    private readonly stringOrTokenArrayStrategies = new Map<string,
        (token: prism.Token, lineIndex: number, charIndex: number, positions: FoundBracket[]) =>
            { lineIndex: number, charIndex: number }>();

    constructor(document: vscode.TextDocument, prismJs: any, settings: Settings) {
        this.settings = settings;
        this.document = document;
        this.prismJs = prismJs;

        const basicStringMatch = (
            token: prism.Token, lineIndex: number, charIndex: number, positions: FoundBracket[]) => {
            return this.matchString(token.content as string, lineIndex, charIndex, positions);
        };
        // Match punctuation on all languages
        this.stringStrategies.set("punctuation", basicStringMatch);

        if (settings.prismLanguageID === "markup") {
            this.stringStrategies.set("attr-name", basicStringMatch);
        }

        if (settings.prismLanguageID === "powershell") {
            this.stringStrategies.set("namespace", basicStringMatch);
        }

        if (settings.prismLanguageID === "markdown") {
            const markdownUrl = (
                token: prism.Token, lineIndex: number, charIndex: number, positions: FoundBracket[]) => {
                // Input: ![Disabled](images/forceUniqueOpeningColorDisabled.png "forceUniqueOpeningColor Disabled")
                // [0]: ![Disabled](images/forceUniqueOpeningColorDisabled.png
                // [1]: "forceUniqueOpeningColor Disabled"
                // [2]: )
                const content = token.content as Array<string | prism.Token>;
                return this.matchStringOrTokenArray(
                    new Set([0, content.length - 1]), content, lineIndex, charIndex, positions);
            };
            this.stringOrTokenArrayStrategies.set("url", markdownUrl);

            const markdownRefUrl = (
                token: prism.Token, lineIndex: number, charIndex: number, positions: FoundBracket[]) => {
                return this.parseTokenOrStringArray(
                    token.content as Array<string | prism.Token>, lineIndex, charIndex, positions);
            };
            this.stringOrTokenArrayStrategies.set("url-reference", markdownRefUrl);
        }
    }

    public dispose() {
        this.settings.dispose();
    }

    public onDidChangeTextDocument(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.updateLowestLineNumber(contentChanges);
        this.triggerUpdateDecorations();
    }

    // Lines are stored in an array, if line is requested outside of array bounds
    // add emptys lines until array is correctly sized
    public getLine(index: number, document: vscode.TextDocument): TextLine {
        if (index < this.lines.length) {
            return this.lines[index];
        }
        else {
            if (this.lines.length === 0) {
                this.lines.push(new TextLine(document.lineAt(0).text, this.settings, 0));
            }

            for (let i = this.lines.length; i <= index; i++) {
                const previousLine = this.lines[this.lines.length - 1];
                const newLine =
                    new TextLine(document.lineAt(i).text, this.settings, i, previousLine.copyMultilineContext());

                this.lines.push(newLine);
            }

            const lineToReturn = this.lines[this.lines.length - 1];
            return lineToReturn;
        }
    }

    public triggerUpdateDecorations() {
        if (this.settings.isDisposed) {
            return;
        }

        if (this.settings.timeOutLength > 0) {

            if (this.updateDecorationTimeout) {
                clearTimeout(this.updateDecorationTimeout);
            }

            this.updateDecorationTimeout = setTimeout(() => {
                this.updateDecorationTimeout = null;
                this.updateDecorations();
                if (this.updateScopeEvent) {
                    this.updateScopeDecorations(this.updateScopeEvent);
                    this.updateScopeEvent = undefined;
                }
            }, this.settings.timeOutLength);
        }
        else {
            this.updateDecorations();
        }
    }

    public updateScopeDecorations(event: vscode.TextEditorSelectionChangeEvent) {
        if (this.updateDecorationTimeout) {
            this.updateScopeEvent = event;
            return;
        }

        const scopes: Set<Scope> = new Set<Scope>();

        event.selections.forEach((selection) => {
            const scope = this.getScope(selection.active);

            if (scope) {
                scopes.add(scope);
            }
        });

        const colorMap = new Map<string, vscode.Range[]>();

        // Reduce all the colors/ranges of the lines into a singular map
        for (const scope of scopes) {
            {
                const existingRanges = colorMap.get(scope.color);

                if (existingRanges !== undefined) {
                    existingRanges.push(scope.open.range);
                    existingRanges.push(scope.close.range);
                }
                else {
                    colorMap.set(scope.color, [scope.open.range, scope.close.range]);
                }
            }
        }

        for (const [color, decoration] of this.settings.scopeDecorations) {
            const ranges = colorMap.get(color);
            if (ranges !== undefined) {
                event.textEditor.setDecorations(decoration, ranges);
            }
            else {
                // We must set non-used colors to an empty array
                // or previous decorations will not be invalidated
                event.textEditor.setDecorations(decoration, []);
            }
        }
    }

    private getScope(position: vscode.Position): Scope | undefined {
        for (let i = position.line; i < this.lines.length; i++) {
            const scope = this.lines[i].getScope(position);

            if (scope) {
                return scope;
            }
        }
    }

    private updateLowestLineNumber(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        for (const contentChange of contentChanges) {
            this.lineToUpdateWhenTimeoutEnds =
                Math.min(this.lineToUpdateWhenTimeoutEnds, contentChange.range.start.line);
        }
    }

    private updateDecorations() {
        // One document may be shared by multiple editors (side by side view)
        const editors: vscode.TextEditor[] =
            vscode.window.visibleTextEditors.filter((e) => this.document === e.document);

        if (editors.length === 0) {
            console.warn("No editors associated with document: " + this.document.fileName);
            return;
        }

        const lineNumber = this.lineToUpdateWhenTimeoutEnds;
        const amountToRemove = this.lines.length - lineNumber;

        // Remove cached lines that need to be updated
        this.lines.splice(lineNumber, amountToRemove);

        const languageID = this.settings.prismLanguageID;

        const text = this.document.getText();
        let tokenized: Array<string | prism.Token>;
        try {
            tokenized = this.prismJs.tokenize(text, this.prismJs.languages[languageID]);
            if (!tokenized) {
                return;
            }
        }
        catch (err) {
            console.warn(err);
            return;
        }

        const positions: FoundBracket[] = [];
        this.parseTokenOrStringArray(tokenized, 0, 0, positions);

        positions.forEach((element) => {
            const currentLine = this.getLine(element.range.start.line, this.document);
            currentLine.addBracket(element);
        });

        this.colorDecorations(editors);
    }

    private parseTokenOrStringArray(
        tokenized: Array<string | any>,
        lineIndex: number,
        charIndex: number,
        positions: FoundBracket[]) {
        tokenized.forEach((token) => {
            if (token instanceof this.prismJs.Token) {
                const result = this.parseToken(token, lineIndex, charIndex, positions);
                charIndex = result.charIndex;
                lineIndex = result.lineIndex;
            }
            else {
                const result = this.parseString(token, lineIndex, charIndex);
                charIndex = result.charIndex;
                lineIndex = result.lineIndex;
            }
        });
        return { lineIndex, charIndex };
    }

    private parseString(content: string, lineIndex: number, charIndex: number) {
        const split = content.split("\n");
        if (split.length > 1) {
            lineIndex += split.length - 1;
            charIndex = split[split.length - 1].length;
        }
        else {
            charIndex += content.length;
        }
        return { lineIndex, charIndex };
    }

    private parseToken(
        token: prism.Token,
        lineIndex: number,
        charIndex: number,
        positions: FoundBracket[]): { lineIndex: number, charIndex: number } {
        if (typeof token.content === "string") {
            const strategy = this.stringStrategies.get(token.type);
            if (strategy) {
                return strategy(token, lineIndex, charIndex, positions);
            }

            return this.parseString(token.content, lineIndex, charIndex);
        }
        else if (Array.isArray(token.content)) {
            const strategy = this.stringOrTokenArrayStrategies.get(token.type);
            if (strategy) {
                return strategy(token, lineIndex, charIndex, positions);
            }

            return this.parseTokenOrStringArray(token.content, lineIndex, charIndex, positions);
        }
        else {
            return this.parseToken(token.content, lineIndex, charIndex, positions);
        }
    }

    private matchString(content: string, lineIndex: number, charIndex: number, positions: FoundBracket[]) {
        if (lineIndex < this.lineToUpdateWhenTimeoutEnds) {
            return this.parseString(content, lineIndex, charIndex);;
        }

        this.settings.regexNonExact.lastIndex = 0;
        let match: RegExpExecArray | null;
        // tslint:disable-next-line:no-conditional-assignment
        while ((match = this.settings.regexNonExact.exec(content)) !== null) {
            const startPos = new vscode.Position(lineIndex, charIndex + match.index);
            const endPos = startPos.translate(0, match[0].length);
            positions.push(new FoundBracket(new vscode.Range(startPos, endPos), match[0]));
        }

        return this.parseString(content, lineIndex, charIndex);
    }

    // Array can be Token or String. Indexes are which indexes should be parsed for brackets
    private matchStringOrTokenArray(
        indexes: Set<number>, array: Array<string | prism.Token>,
        lineIndex: number, charIndex: number, positions: FoundBracket[]) {
        for (let i = 0; i < array.length; i++) {
            const content = array[i];
            let result: { lineIndex: number, charIndex: number };
            if (indexes.has(i)) {
                indexes.delete(i);
                result = this.matchString(content as string, lineIndex, charIndex, positions);
            }
            else {
                result = this.parseTokenOrStringArray([content], lineIndex, charIndex, positions);
            }
            lineIndex = result.lineIndex;
            charIndex = result.charIndex;
        }
        return { lineIndex, charIndex };
    }

    private colorDecorations(editors: vscode.TextEditor[]) {
        const colorMap = new Map<string, vscode.Range[]>();

        // Reduce all the colors/ranges of the lines into a singular map
        for (const line of this.lines) {
            {
                for (const [color, ranges] of line.colorRanges) {
                    const existingRanges = colorMap.get(color);

                    if (existingRanges !== undefined) {
                        existingRanges.push(...ranges);
                    }
                    else {
                        // Slice because we will be adding values to this array in the future,
                        // but don't want to modify the original array which is stored per line
                        colorMap.set(color, ranges.slice());
                    }
                }
            }
        }

        for (const [color, decoration] of this.settings.bracketDecorations) {
            if (color === "") {
                continue;
            }
            const ranges = colorMap.get(color);
            editors.forEach((editor) => {
                if (ranges !== undefined) {
                    editor.setDecorations(decoration, ranges);
                }
                else {
                    // We must set non-used colors to an empty array
                    // or previous decorations will not be invalidated
                    editor.setDecorations(decoration, []);
                }
            });
        }

        this.lineToUpdateWhenTimeoutEnds = Infinity;
    }
}
