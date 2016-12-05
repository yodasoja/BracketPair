'use strict';

import * as vscode from 'vscode';
import DocumentManager from "./documentManager";
import * as assert from 'assert';
import BracketPair from "./bracketPair";

export function activate(context: vscode.ExtensionContext) {
    let configuration = vscode.workspace.getConfiguration();
    let bracketSettings = configuration.get("bracketPairColorizer.pairColors") as [{}];
    let bracketPairs: BracketPair[] = [];
    let settingsCount = 0;
    for (let setting of bracketSettings) {
        let settingLength = Object.keys(setting).length;
        assert(settingLength === 3, "Setting [" + settingsCount + "] only has " + settingLength + " elements, expected " + 3);

        let brackets = setting[0] as string;
        assert(brackets.length === 2, "User defined brackets must be two characters");

        let colors = setting[1] as string[];
        assert(colors.length !== 0, "User defined bracket colors must not be empty");

        let orphanColor = setting[2] as string;
        assert(orphanColor.length !== 0, "User defined orphan color must not be empty");

        bracketPairs.push(new BracketPair(brackets[0], brackets[1], colors, orphanColor));
        settingsCount++;
    }

    let timeout = configuration.get("bracketPairColorizer.timeOut") as number;

    let documentManager = new DocumentManager(bracketPairs, timeout);

    let activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        documentManager.updateDecorations(activeEditor);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (activeEditor) {
            documentManager.updateDecorations(activeEditor);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            documentManager.onDidChangeTextDocument(activeEditor, event.contentChanges);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidCloseTextDocument(event => {
        if (activeEditor) {
            documentManager.onDidCloseTextDocument(event);
        }
    }, null, context.subscriptions);
}

export function deactivate() {
}