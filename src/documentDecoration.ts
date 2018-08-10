import * as vscode from "vscode";
import { IGrammar,  IStackElement, IToken } from "./IExtensionGrammar";
import LineState from "./lineState";
import Scope from "./scope";
import Settings from "./settings";
import TextLine from "./textLine";

export default class DocumentDecoration {
    public readonly settings: Settings;

    private updateDecorationTimeout: NodeJS.Timer | null;
    private updateScopeTimeout: NodeJS.Timer | null;
    // This program caches lines, and will only analyze linenumbers including or above a modified line
    private lineToUpdateWhenTimeoutEnds = 0;
    private lines: TextLine[] = [];
    private readonly document: vscode.TextDocument;
    private nextScopeEvent: vscode.TextEditorSelectionChangeEvent | undefined;
    private previousScopeEvent: vscode.TextEditorSelectionChangeEvent | undefined;
    private readonly tokenizer: IGrammar;
    private scopeDecorations: vscode.TextEditorDecorationType[] = [];
    private scopeSelectionHistory: vscode.Selection[][] = [];
    private readonly tokenEndTrimLength: number;
    constructor(document: vscode.TextDocument, textMate: IGrammar, settings: Settings) {
        this.settings = settings;
        this.document = document;
        this.tokenizer = textMate;

        const scopeName = (this.tokenizer as any)._grammar.scopeName as string;
        const split = scopeName.split(".");
        this.tokenEndTrimLength = split[split.length - 1].length + 1;
    }

    public dispose() {
        this.settings.dispose();
        this.disposeScopeDecorations();
    }

    public onDidChangeTextDocument(contentChanges: vscode.TextDocumentContentChangeEvent[]) {
        this.updateLowestLineNumber(contentChanges);
        this.triggerUpdateDecorations();
    }

    public expandBracketSelection(editor: vscode.TextEditor) {
        const newSelections: vscode.Selection[] = [];

        editor.selections.forEach((selection) => {
            let selections: vscode.Selection[] = [];

            if (this.scopeSelectionHistory.length !== 0) {
                selections = this.scopeSelectionHistory[this.scopeSelectionHistory.length - 1];
            }
            else {
                this.scopeSelectionHistory.push(editor.selections);
            }

            const nextPos = this.document.validatePosition(selection.active.translate(0, 1));
            const nextScope = this.getScope(nextPos);
            if (nextScope) {
                const start = this.document.validatePosition(nextScope.open.range.start.translate(0, 1));
                const end = this.document.validatePosition(nextScope.close.range.end.translate(0, -1));
                newSelections.push(new vscode.Selection(start, end));
            }
        });

        if (newSelections.length > 0) {
            this.scopeSelectionHistory.push(newSelections);

            editor.selections = newSelections;
        }
    }

    public undoBracketSelection(editor: vscode.TextEditor) {
        this.scopeSelectionHistory.pop();

        if (this.scopeSelectionHistory.length === 0) {
            return;
        }

        const scopes = this.scopeSelectionHistory[this.scopeSelectionHistory.length - 1];
        editor.selections = scopes;
    }

    // Lines are stored in an array, if line is requested outside of array bounds
    // add emptys lines until array is correctly sized
    public getLine(index: number, ruleStack: IStackElement): TextLine {
        if (index < this.lines.length) {
            return this.lines[index];
        }
        else {
            if (this.lines.length === 0) {
                this.lines.push(
                    new TextLine(0, ruleStack, new LineState(this.settings)),
                );
            }

            if (index < this.lines.length) {
                return this.lines[index];
            }

            if (index === this.lines.length) {
                const previousLine = this.lines[this.lines.length - 1];
                const newLine =
                    new TextLine(index, ruleStack, previousLine.cloneState());

                this.lines.push(newLine);
                return newLine;
            }

            throw new Error("Cannot look more than one line ahead");
        }
    }

    public triggerUpdateDecorations() {
        if (this.updateDecorationTimeout) {
            clearTimeout(this.updateDecorationTimeout);
        }

        this.updateDecorationTimeout = setTimeout(() => {
            this.updateDecorationTimeout = null;
            this.updateDecorations();
            if (this.nextScopeEvent) {
                this.updateScopeDecorations();
            }
        }, this.settings.timeOutLength);
    }

    public triggerUpdateScopeDecorations(event: vscode.TextEditorSelectionChangeEvent) {
        this.nextScopeEvent = event;

        if (this.updateDecorationTimeout) {
            return;
        }

        if (this.updateScopeTimeout) {
            clearTimeout(this.updateScopeTimeout);
        }
        else {
            this.updateScopeDecorations();
        }

        this.updateScopeTimeout = setTimeout(() => {
            this.updateScopeTimeout = null;
            this.updateScopeDecorations();
        }, this.settings.timeOutLength);
    }

    private updateScopeDecorations() {
        if (!this.nextScopeEvent) {
            return;
        }
        const event = this.nextScopeEvent;
        this.nextScopeEvent = undefined;
        if (event === this.previousScopeEvent) {
            return;
        }

        this.previousScopeEvent = event;

        if (this.settings.isDisposed) {
            return;
        }

        // console.time("updateScopeDecorations");

        this.disposeScopeDecorations();

        const scopes: Set<Scope> = new Set<Scope>();

        event.selections.forEach((selection) => {
            const scope = this.getScope(selection.active);

            if (scope) {
                scopes.add(scope);
            }
        });

        for (const scope of scopes) {
            {
                if (this.settings.highlightActiveScope) {
                    const decoration =
                        this.settings.createScopeBracketDecorations(scope.color);
                    event.textEditor.setDecorations(decoration, [scope.open.range, scope.close.range]);
                    this.scopeDecorations.push(decoration);
                }
            }

            if (this.settings.showBracketsInGutter) {
                if (scope.open.range.start.line === scope.close.range.start.line) {
                    const decoration = this.settings.createGutterBracketDecorations
                        (scope.color, scope.open.character + scope.close.character);
                    event.textEditor.setDecorations(decoration, [scope.open.range, scope.close.range]);
                    this.scopeDecorations.push(decoration);
                }
                else {
                    const decorationOpen =
                        this.settings.createGutterBracketDecorations(scope.color, scope.open.character);
                    event.textEditor.setDecorations(decorationOpen, [scope.open.range]);
                    this.scopeDecorations.push(decorationOpen);
                    const decorationClose =
                        this.settings.createGutterBracketDecorations(scope.color, scope.close.character);
                    event.textEditor.setDecorations(decorationClose, [scope.close.range]);
                    this.scopeDecorations.push(decorationClose);
                }
            }

            if (this.settings.showBracketsInRuler) {
                const decoration =
                    this.settings.createRulerBracketDecorations(scope.color);
                event.textEditor.setDecorations(decoration, [scope.open.range, scope.close.range]);
                this.scopeDecorations.push(decoration);
            }

            const lastWhiteSpaceCharacterIndex =
                this.document.lineAt(scope.close.range.start).firstNonWhitespaceCharacterIndex;
            const lastBracketStartIndex = scope.close.range.start.character;
            const lastBracketIsFirstCharacterOnLine = lastWhiteSpaceCharacterIndex === lastBracketStartIndex;
            let leftBorderColumn = Infinity;

            const tabSize = event.textEditor.options.tabSize as number;

            const position =
                this.settings.scopeLineRelativePosition ?
                    Math.min(scope.close.range.start.character, scope.open.range.start.character) : 0;

            let leftBorderIndex = position;

            const start = scope.open.range.start.line + 1;
            const end = scope.close.range.start.line;

            // Start -1 because prefer draw line at current indent level
            for (let lineIndex = start - 1; lineIndex <= end; lineIndex++) {
                const line = this.document.lineAt(lineIndex);

                if (!line.isEmptyOrWhitespace) {
                    const firstCharIndex = line.firstNonWhitespaceCharacterIndex;
                    leftBorderIndex = Math.min(leftBorderIndex, firstCharIndex);
                    leftBorderColumn = Math.min(leftBorderColumn,
                        this.calculateColumnFromCharIndex(line.text, firstCharIndex, tabSize));
                }
            }

            if (this.settings.showVerticalScopeLine) {
                const verticalLineRanges: Array<{ range: vscode.Range, valid: boolean }> = [];

                const endOffset = lastBracketIsFirstCharacterOnLine ? end - 1 : end;
                for (let lineIndex = start; lineIndex <= endOffset; lineIndex++) {
                    const line = this.document.lineAt(lineIndex);
                    const linePosition = new vscode.Position(lineIndex,
                        this.calculateCharIndexFromColumn(line.text, leftBorderColumn, tabSize));
                    const range = new vscode.Range(linePosition, linePosition);
                    const valid = line.text.length >= leftBorderIndex;
                    verticalLineRanges.push({ range, valid });
                }

                const safeFallbackPosition = new vscode.Position(start - 1, leftBorderIndex);
                this.setVerticalLineDecoration(scope, event, safeFallbackPosition, verticalLineRanges);
            }

            if (this.settings.showHorizontalScopeLine) {
                const underlineLineRanges: vscode.Range[] = [];
                const overlineLineRanges: vscode.Range[] = [];

                if (scope.open.range.start.line === scope.close.range.start.line) {
                    underlineLineRanges.push(new vscode.Range(scope.open.range.start, scope.close.range.end));
                }
                else {
                    const startLine = this.document.lineAt(scope.open.range.start.line);
                    const endLine = this.document.lineAt(scope.close.range.start.line);

                    const leftStartPos = new vscode.Position(scope.open.range.start.line,
                        this.calculateCharIndexFromColumn(startLine.text, leftBorderColumn, tabSize));
                    const leftEndPos = new vscode.Position(scope.close.range.start.line,
                        this.calculateCharIndexFromColumn(endLine.text, leftBorderColumn, tabSize));

                    underlineLineRanges.push(new vscode.Range(leftStartPos, scope.open.range.end));
                    if (lastBracketIsFirstCharacterOnLine) {
                        overlineLineRanges.push(new vscode.Range(leftEndPos, scope.close.range.end));
                    }
                    else {
                        underlineLineRanges.push(new vscode.Range(leftEndPos, scope.close.range.end));
                    }
                }

                if (underlineLineRanges) {
                    this.setUnderLineDecoration(scope, event, underlineLineRanges);
                }

                if (overlineLineRanges) {
                    this.setOverLineDecoration(scope, event, overlineLineRanges);
                }
            }
        }

        // console.timeEnd("updateScopeDecorations");
    }

    private setOverLineDecoration(
        scope: Scope,
        event: vscode.TextEditorSelectionChangeEvent,
        overlineLineRanges: vscode.Range[]) {
        const lineDecoration = this.settings.createScopeLineDecorations(scope.color, true, false, false, false);
        event.textEditor.setDecorations(lineDecoration, overlineLineRanges);
        this.scopeDecorations.push(lineDecoration);
    }

    private setUnderLineDecoration(
        scope: Scope,
        event: vscode.TextEditorSelectionChangeEvent,
        underlineLineRanges: vscode.Range[]) {
        const lineDecoration = this.settings.createScopeLineDecorations(scope.color, false, false, true, false);
        event.textEditor.setDecorations(lineDecoration, underlineLineRanges);
        this.scopeDecorations.push(lineDecoration);
    }

    private setVerticalLineDecoration(
        scope: Scope,
        event: vscode.TextEditorSelectionChangeEvent,
        fallBackPosition: vscode.Position,
        verticleLineRanges: Array<{ range: vscode.Range, valid: boolean }>,
    ) {
        const offsets:
            Array<{ range: vscode.Range, downOffset: number }> = [];
        const normalDecoration = this.settings.createScopeLineDecorations(scope.color, false, false, false, true);

        if (verticleLineRanges.length === 0) {
            return;
        }

        const normalRanges = verticleLineRanges.filter((e) => e.valid).map((e) => e.range);

        // Get first valid range, if non fall-back to opening position
        let aboveValidRange = new vscode.Range(fallBackPosition, fallBackPosition);
        for (const lineRange of verticleLineRanges) {
            if (lineRange.valid) {
                aboveValidRange = lineRange.range;
                break;
            }
        }

        /* Keep updating last valid range to keep offset distance minimum
         to prevent missing decorations when scrolling */
        for (const lineRange of verticleLineRanges) {
            if (lineRange.valid) {
                aboveValidRange = lineRange.range;
            }
            else {
                const offset = lineRange.range.start.line - aboveValidRange.start.line;
                offsets.push({ range: aboveValidRange, downOffset: offset });
            }
        }

        event.textEditor.setDecorations(normalDecoration, normalRanges);
        this.scopeDecorations.push(normalDecoration);

        offsets.forEach((offset) => {
            const decoration = this.settings.createScopeLineDecorations(
                scope.color, false, false, false, true, offset.downOffset,
            );
            event.textEditor.setDecorations(decoration, [offset.range]);
            this.scopeDecorations.push(decoration);
        });
    }

    private disposeScopeDecorations() {
        this.scopeDecorations.forEach((decoration) => {
            decoration.dispose();
        });

        this.scopeDecorations = [];
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
        if (this.settings.isDisposed) {
            return;
        }

        // One document may be shared by multiple editors (side by side view)
        const editors: vscode.TextEditor[] =
            vscode.window.visibleTextEditors.filter((e) => this.document === e.document);

        if (editors.length === 0) {
            console.warn("No editors associated with document: " + this.document.fileName);
            return;
        }

        // console.time("updateDecorations");

        const lineNumber = this.lineToUpdateWhenTimeoutEnds;
        const amountToRemove = this.lines.length - lineNumber;

        // Remove cached lines that need to be updated
        const removed = this.lines.splice(lineNumber, amountToRemove);

        try {
            const previousLineNumber = lineNumber - 1;
            let previousRuleStack: undefined | IStackElement;
            if (previousLineNumber >= 0 && previousLineNumber < this.lines.length) {
                previousRuleStack = this.lines[previousLineNumber].getRuleStack();
            }

            for (let i = lineNumber; i < this.document.lineCount; i++) {
                const line = this.document.lineAt(i);

                const tokenized = this.tokenizer.tokenizeLine(line.text, previousRuleStack);

                const ruleStack = tokenized.ruleStack;
                const tokens = tokenized.tokens;

                const currentLine = this.getLine(i, ruleStack);

                this.parseTokens(tokens, currentLine, line);

                previousRuleStack = ruleStack;
            }
        }
        catch (err) {
            console.error(err);
            return;
        }

        this.colorDecorations(editors);

        // console.timeEnd("updateDecorations");
    }

    private parseTokens(tokens: IToken[], currentLine: TextLine, line: vscode.TextLine) {
        const stack = currentLine.getCharStack();
        tokens.forEach((token) => {
            if (token.scopes.length > 1) {
                const type = token.scopes[token.scopes.length - 1];
                this.parseTokensJavascript(type, token, currentLine, line.text, stack);
            }
            else {
                currentLine.addScope(undefined, 0, token.startIndex, token.endIndex);
            }
        });
    }

    private parseTokensJavascript(
        type: string,
        token: IToken,
        currentLine: TextLine,
        text: string,
        stackMap: Map<string, string[]>,
    ) {
        // Remove file extension
        type = type.slice(0, -this.tokenEndTrimLength);
        const beginString = ".begin";
        const endString = ".end";
        if (type.endsWith(beginString)) {
            type = type.slice(0, -beginString.length);
        } else if (type.endsWith(endString)) {
            type = type.slice(0, -endString.length);
        }

        if (type === "meta.brace.round" || type === "punctuation.definition.parameters") {
            const openChar = "(";
            const closeChar = ")";
            const currentMatch = text.substring(token.startIndex, token.endIndex);
            if (currentMatch === openChar) {
                this.manageTokenStack(openChar, stackMap, type, currentLine, token);
            }
            else {
                this.manageTokenStack(closeChar, stackMap, type, currentLine, token);
            }
            return;
        }

        if (type === "punctuation.definition.block") {
            const openChar = "{";
            const closeChar = "}";
            if (text.substring(token.startIndex, token.endIndex) === openChar) {
                this.manageTokenStack(openChar, stackMap, type, currentLine, token);
            }
            else {
                this.manageTokenStack(closeChar, stackMap, type, currentLine, token);
            }
            return;
        }

        // if (((type.includes("punctuation.") && (type.includes(".block.") ||
        //     (type.includes(".begin.") || type.includes(".end."))))
        //     ||
        //     type.includes(".brace."))) {
        //     const depth = token.scopes.length;
        //     currentLine.addScope(type, depth, token.startIndex, token.endIndex);
        // }
    }

    private manageTokenStack(
        currentChar: string,
        stackMap: Map<string, string[]>,
        type: string,
        currentLine: TextLine,
        token: IToken) {
        const stack = stackMap.get(type);
        if (stack && stack.length > 0) {
            const topStack = stack[stack.length - 1];
            if (topStack === currentChar) {
                stack.push(currentChar);
                currentLine.addScope(type, stack.length + token.scopes.length, token.startIndex, token.endIndex);
            }
            else {
                currentLine.addScope(type, stack.length + token.scopes.length, token.startIndex, token.endIndex);
                stack.pop();
            }
        }
        else {
            const newStack = [currentChar];
            stackMap.set(type, newStack);
            currentLine.addScope(type, newStack.length + token.scopes.length, token.startIndex, token.endIndex);
        }
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

    private calculateColumnFromCharIndex(lineText: string, charIndex: number, tabSize: number): number {
        let spacing = 0;
        for (let index = 0; index < charIndex; index++) {
            if (lineText.charAt(index) === "\t") {
                spacing += tabSize - spacing % tabSize;
            }
            else {
                spacing++;
            }
        }
        return spacing;
    }

    private calculateCharIndexFromColumn(lineText: string, column: number, tabSize: number): number {
        let spacing = 0;
        for (let index = 0; index <= column; index++) {
            if (spacing >= column) {
                return index;
            }
            if (lineText.charAt(index) === "\t") {
                spacing += tabSize - spacing % tabSize;
            }
            else { spacing++; }
        }
        return spacing;
    }
}
