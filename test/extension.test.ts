//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import ColorMode from "../src/colorMode";
import DocumentDecoration from "../src/documentDecoration";
import * as myExtension from "../src/extension";
import Settings from "../src/settings";

// tslint:disable:object-literal-sort-keys

// Defines a Mocha test suite to group tests of similar kind together
suite("Settings Tests", () => {

    test("timeOut", () => {
        const settings = new Settings({ languageID: "typescript", timeOutLength: 0 });
        assert.equal(settings.timeOutLength, 0);
    });

    test("forceUniqueOpeningColor", () => {
        let settings = new Settings({ languageID: "typescript", forceUniqueOpeningColor: true });
        assert.equal(settings.forceUniqueOpeningColor, true);

        settings = new Settings({ languageID: "typescript", forceUniqueOpeningColor: false });
        assert.equal(settings.forceUniqueOpeningColor, false);
    });

    test("forceIterationColorCycle", () => {
        let settings = new Settings({ languageID: "typescript", forceIterationColorCycle: true });
        assert.equal(settings.forceIterationColorCycle, true);

        settings = new Settings({ languageID: "typescript", forceIterationColorCycle: false });
        assert.equal(settings.forceIterationColorCycle, false);
    });

    test("contextualParsing", () => {
        let settings = new Settings({ languageID: "typescript", contextualParsing: true });
        assert.equal(settings.contextualParsing, true);

        settings = new Settings({ languageID: "typescript", contextualParsing: false });
        assert.equal(settings.contextualParsing, false);
    });

    test("colorMode", () => {
        let settings = new Settings({ languageID: "typescript", colorMode: ColorMode.Independent });
        assert.equal(settings.colorMode, ColorMode.Independent);

        settings = new Settings({ languageID: "typescript", colorMode: ColorMode.Consecutive });
        assert.equal(settings.colorMode, ColorMode.Consecutive);
    });

    test("consecutivePairColors", () => {
        const consecutiveSettings: [{}] = ["ab", "cd", ["color0", "color1"], "orphanColor"];

        const settings = new Settings({
            languageID: "typescript",
            timeOutLength: 0,
            colorMode: ColorMode.Consecutive,
            consecutiveSettings,
        });

        assert.equal(settings.colorMode, ColorMode.Consecutive);

        assert.equal(settings.bracketPairs[0].openCharacter, "a");
        assert.equal(settings.bracketPairs[0].closeCharacter, "b");
        assert.equal(settings.bracketPairs[1].openCharacter, "c");
        assert.equal(settings.bracketPairs[1].closeCharacter, "d");

        assert.equal(settings.bracketPairs[0].colors[0], "color0");
        assert.equal(settings.bracketPairs[0].colors[1], "color1");
        assert.equal(settings.bracketPairs[1].colors[0], "color0");
        assert.equal(settings.bracketPairs[1].colors[1], "color1");

        assert.equal(settings.bracketPairs[0].orphanColor, "orphanColor");
        assert.equal(settings.bracketPairs[1].orphanColor, "orphanColor");
    });

    test("independentPairColors", () => {
        const independentSettings: [[{}]] =
            [
                [
                    "ab",
                    [
                        "color0",
                        "color1",
                    ],
                    "orphanColor0",
                ],
                [
                    "cd",
                    [
                        "color2",
                        "color3",
                    ],
                    "orphanColor1",
                ],
            ];

        const settings = new Settings({
            languageID: "typescript",
            timeOutLength: 0,
            colorMode: ColorMode.Independent,
            independentSettings,
        });
        assert.equal(settings.colorMode, ColorMode.Independent);
        assert.equal(settings.bracketPairs[0].openCharacter, "a");
        assert.equal(settings.bracketPairs[0].closeCharacter, "b");
        assert.equal(settings.bracketPairs[1].openCharacter, "c");
        assert.equal(settings.bracketPairs[1].closeCharacter, "d");

        assert.equal(settings.bracketPairs[0].colors[0], "color0");
        assert.equal(settings.bracketPairs[0].colors[1], "color1");
        assert.equal(settings.bracketPairs[1].colors[0], "color2");
        assert.equal(settings.bracketPairs[1].colors[1], "color3");

        assert.equal(settings.bracketPairs[0].orphanColor, "orphanColor0");
        assert.equal(settings.bracketPairs[1].orphanColor, "orphanColor1");
    });
});

suite("Consecutive Coloring Test", () => {
    const consecutiveSettings: [{}] = [
        "()",
        "[]",
        "{}",
        [
            "Gold",
            "Orchid",
            "LightSkyBlue",
        ],
        "Red",
    ];
    const settings = new Settings({
        languageID: "typescript",
        timeOutLength: 0,
        colorMode: ColorMode.Consecutive,
        consecutiveSettings,
    });

    test("Line 1", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line0 = document.getLine(0, textDocument);

            const colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line0.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 0 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 0 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 0 &&
                    colorRangesGold[1].start.character === 5 &&
                    colorRangesGold[1].end.line === 0 &&
                    colorRangesGold[1].end.character === 6);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line0.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 2);
                assert(colorRangesOrchid[0].start.line === 0 &&
                    colorRangesOrchid[0].start.character === 1 &&
                    colorRangesOrchid[0].end.line === 0 &&
                    colorRangesOrchid[0].end.character === 2);

                assert(colorRangesOrchid[1].start.line === 0 &&
                    colorRangesOrchid[1].start.character === 4 &&
                    colorRangesOrchid[1].end.line === 0 &&
                    colorRangesOrchid[1].end.character === 5);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 2);
                assert(colorRangesLightSkyBlue[0].start.line === 0 &&
                    colorRangesLightSkyBlue[0].start.character === 2 &&
                    colorRangesLightSkyBlue[0].end.line === 0 &&
                    colorRangesLightSkyBlue[0].end.character === 3);

                assert(colorRangesLightSkyBlue[1].start.line === 0 &&
                    colorRangesLightSkyBlue[1].start.character === 3 &&
                    colorRangesLightSkyBlue[1].end.line === 0 &&
                    colorRangesLightSkyBlue[1].end.character === 4);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 2", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line1 = document.getLine(1, textDocument);

            const colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line1.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 1);
                assert(colorRangesGold[0].start.line === 1 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 1 &&
                    colorRangesGold[0].end.character === 1);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line1.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 1);
                assert(colorRangesOrchid[0].start.line === 1 &&
                    colorRangesOrchid[0].start.character === 1 &&
                    colorRangesOrchid[0].end.line === 1 &&
                    colorRangesOrchid[0].end.character === 2);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 1);
                assert(colorRangesLightSkyBlue[0].start.line === 1 &&
                    colorRangesLightSkyBlue[0].start.character === 2 &&
                    colorRangesLightSkyBlue[0].end.line === 1 &&
                    colorRangesLightSkyBlue[0].end.character === 3);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 3", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line2 = document.getLine(2, textDocument);

            const colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line2.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 1);
                assert(colorRangesGold[0].start.line === 2 &&
                    colorRangesGold[0].start.character === 2 &&
                    colorRangesGold[0].end.line === 2 &&
                    colorRangesGold[0].end.character === 3);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line2.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 1);
                assert(colorRangesOrchid[0].start.line === 2 &&
                    colorRangesOrchid[0].start.character === 1 &&
                    colorRangesOrchid[0].end.line === 2 &&
                    colorRangesOrchid[0].end.character === 2);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 1);
                assert(colorRangesLightSkyBlue[0].start.line === 2 &&
                    colorRangesLightSkyBlue[0].start.character === 0 &&
                    colorRangesLightSkyBlue[0].end.line === 2 &&
                    colorRangesLightSkyBlue[0].end.character === 1);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 4", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line3 = document.getLine(3, textDocument);

            const colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            const colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            const colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            const colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Line 5", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line4 = document.getLine(4, textDocument);

            const colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line4.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 6);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line4.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            const colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });
});

suite("Consecutive Coloring Test Unique Opening Color", () => {
    const consecutiveSettings: [{}] = [
        "()",
        "[]",
        "{}",
        [
            "Gold",
            "Orchid",
            "LightSkyBlue",
        ],
        "Red",
    ];

    const settings = new Settings({
        languageID: "typescript",
        colorMode: ColorMode.Consecutive,
        consecutiveSettings,
        forceUniqueOpeningColor: true,
        timeOutLength: 0,
    });

    test("Line 1", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line0 = document.getLine(0, textDocument);

            const colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line0.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 0 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 0 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 0 &&
                    colorRangesGold[1].start.character === 5 &&
                    colorRangesGold[1].end.line === 0 &&
                    colorRangesGold[1].end.character === 6);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line0.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 2);
                assert(colorRangesOrchid[0].start.line === 0 &&
                    colorRangesOrchid[0].start.character === 1 &&
                    colorRangesOrchid[0].end.line === 0 &&
                    colorRangesOrchid[0].end.character === 2);

                assert(colorRangesOrchid[1].start.line === 0 &&
                    colorRangesOrchid[1].start.character === 4 &&
                    colorRangesOrchid[1].end.line === 0 &&
                    colorRangesOrchid[1].end.character === 5);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 2);
                assert(colorRangesLightSkyBlue[0].start.line === 0 &&
                    colorRangesLightSkyBlue[0].start.character === 2 &&
                    colorRangesLightSkyBlue[0].end.line === 0 &&
                    colorRangesLightSkyBlue[0].end.character === 3);

                assert(colorRangesLightSkyBlue[1].start.line === 0 &&
                    colorRangesLightSkyBlue[1].start.character === 3 &&
                    colorRangesLightSkyBlue[1].end.line === 0 &&
                    colorRangesLightSkyBlue[1].end.character === 4);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 2", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line1 = document.getLine(1, textDocument);

            const colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line1.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 1);
                assert(colorRangesGold[0].start.line === 1 &&
                    colorRangesGold[0].start.character === 2 &&
                    colorRangesGold[0].end.line === 1 &&
                    colorRangesGold[0].end.character === 3);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line1.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 1);
                assert(colorRangesOrchid[0].start.line === 1 &&
                    colorRangesOrchid[0].start.character === 0 &&
                    colorRangesOrchid[0].end.line === 1 &&
                    colorRangesOrchid[0].end.character === 1);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 1);
                assert(colorRangesLightSkyBlue[0].start.line === 1 &&
                    colorRangesLightSkyBlue[0].start.character === 1 &&
                    colorRangesLightSkyBlue[0].end.line === 1 &&
                    colorRangesLightSkyBlue[0].end.character === 2);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 3", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line2 = document.getLine(2, textDocument);

            const colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line2.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 1);
                assert(colorRangesGold[0].start.line === 2 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 2 &&
                    colorRangesGold[0].end.character === 1);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line2.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 1);
                assert(colorRangesOrchid[0].start.line === 2 &&
                    colorRangesOrchid[0].start.character === 2 &&
                    colorRangesOrchid[0].end.line === 2 &&
                    colorRangesOrchid[0].end.character === 3);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 1);
                assert(colorRangesLightSkyBlue[0].start.line === 2 &&
                    colorRangesLightSkyBlue[0].start.character === 1 &&
                    colorRangesLightSkyBlue[0].end.line === 2 &&
                    colorRangesLightSkyBlue[0].end.character === 2);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 5", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line3 = document.getLine(3, textDocument);

            const colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            const colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            const colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            const colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Line 6", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line4 = document.getLine(4, textDocument);

            const colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line4.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 4);
                assert(colorRangesGold[0].start.line === 4 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 4 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 4 &&
                    colorRangesGold[1].start.character === 1 &&
                    colorRangesGold[1].end.line === 4 &&
                    colorRangesGold[1].end.character === 2);

                assert(colorRangesGold[2].start.line === 4 &&
                    colorRangesGold[2].start.character === 4 &&
                    colorRangesGold[2].end.line === 4 &&
                    colorRangesGold[2].end.character === 5);

                assert(colorRangesGold[3].start.line === 4 &&
                    colorRangesGold[3].start.character === 5 &&
                    colorRangesGold[3].end.line === 4 &&
                    colorRangesGold[3].end.character === 6);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line4.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 2);
                assert(colorRangesOrchid[0].start.line === 4 &&
                    colorRangesOrchid[0].start.character === 2 &&
                    colorRangesOrchid[0].end.line === 4 &&
                    colorRangesOrchid[0].end.character === 3);

                assert(colorRangesOrchid[1].start.line === 4 &&
                    colorRangesOrchid[1].start.character === 3 &&
                    colorRangesOrchid[1].end.line === 4 &&
                    colorRangesOrchid[1].end.character === 4);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });
});

suite("Consecutive Coloring Test Force Iteration Color Cycle", () => {
    const consecutiveSettings: [{}] = [
        "()",
        "[]",
        "{}",
        [
            "Gold",
            "Orchid",
            "LightSkyBlue",
        ],
        "Red",
    ];

    const settings = new Settings({
        languageID: "typescript",
        colorMode: ColorMode.Consecutive,
        consecutiveSettings,
        forceIterationColorCycle: true,
        timeOutLength: 0,
    });

    test("Line 1", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line0 = document.getLine(0, textDocument);

            const colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line0.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 0 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 0 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 0 &&
                    colorRangesGold[1].start.character === 5 &&
                    colorRangesGold[1].end.line === 0 &&
                    colorRangesGold[1].end.character === 6);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line0.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 2);
                assert(colorRangesOrchid[0].start.line === 0 &&
                    colorRangesOrchid[0].start.character === 1 &&
                    colorRangesOrchid[0].end.line === 0 &&
                    colorRangesOrchid[0].end.character === 2);

                assert(colorRangesOrchid[1].start.line === 0 &&
                    colorRangesOrchid[1].start.character === 4 &&
                    colorRangesOrchid[1].end.line === 0 &&
                    colorRangesOrchid[1].end.character === 5);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 2);
                assert(colorRangesLightSkyBlue[0].start.line === 0 &&
                    colorRangesLightSkyBlue[0].start.character === 2 &&
                    colorRangesLightSkyBlue[0].end.line === 0 &&
                    colorRangesLightSkyBlue[0].end.character === 3);

                assert(colorRangesLightSkyBlue[1].start.line === 0 &&
                    colorRangesLightSkyBlue[1].start.character === 3 &&
                    colorRangesLightSkyBlue[1].end.line === 0 &&
                    colorRangesLightSkyBlue[1].end.character === 4);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 2", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line1 = document.getLine(1, textDocument);

            const colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line1.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 1);
                assert(colorRangesGold[0].start.line === 1 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 1 &&
                    colorRangesGold[0].end.character === 1);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line1.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 1);
                assert(colorRangesOrchid[0].start.line === 1 &&
                    colorRangesOrchid[0].start.character === 1 &&
                    colorRangesOrchid[0].end.line === 1 &&
                    colorRangesOrchid[0].end.character === 2);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 1);
                assert(colorRangesLightSkyBlue[0].start.line === 1 &&
                    colorRangesLightSkyBlue[0].start.character === 2 &&
                    colorRangesLightSkyBlue[0].end.line === 1 &&
                    colorRangesLightSkyBlue[0].end.character === 3);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 3", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line2 = document.getLine(2, textDocument);

            const colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line2.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 1);
                assert(colorRangesGold[0].start.line === 2 &&
                    colorRangesGold[0].start.character === 2 &&
                    colorRangesGold[0].end.line === 2 &&
                    colorRangesGold[0].end.character === 3);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line2.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 1);
                assert(colorRangesOrchid[0].start.line === 2 &&
                    colorRangesOrchid[0].start.character === 1 &&
                    colorRangesOrchid[0].end.line === 2 &&
                    colorRangesOrchid[0].end.character === 2);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 1);
                assert(colorRangesLightSkyBlue[0].start.line === 2 &&
                    colorRangesLightSkyBlue[0].start.character === 0 &&
                    colorRangesLightSkyBlue[0].end.line === 2 &&
                    colorRangesLightSkyBlue[0].end.character === 1);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 4", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line3 = document.getLine(3, textDocument);

            const colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            const colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            const colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            const colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Line 5", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line4 = document.getLine(4, textDocument);

            const colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line4.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 4 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 4 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 4 &&
                    colorRangesGold[1].start.character === 1 &&
                    colorRangesGold[1].end.line === 4 &&
                    colorRangesGold[1].end.character === 2);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line4.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 2);
                assert(colorRangesOrchid[0].start.line === 4 &&
                    colorRangesOrchid[0].start.character === 2 &&
                    colorRangesOrchid[0].end.line === 4 &&
                    colorRangesOrchid[0].end.character === 3);

                assert(colorRangesOrchid[1].start.line === 4 &&
                    colorRangesOrchid[1].start.character === 3 &&
                    colorRangesOrchid[1].end.line === 4 &&
                    colorRangesOrchid[1].end.character === 4);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 2);
                assert(colorRangesLightSkyBlue[0].start.line === 4 &&
                    colorRangesLightSkyBlue[0].start.character === 4 &&
                    colorRangesLightSkyBlue[0].end.line === 4 &&
                    colorRangesLightSkyBlue[0].end.character === 5);

                assert(colorRangesLightSkyBlue[1].start.line === 4 &&
                    colorRangesLightSkyBlue[1].start.character === 5 &&
                    colorRangesLightSkyBlue[1].end.line === 4 &&
                    colorRangesLightSkyBlue[1].end.character === 6);
            }
            else {
                assert(false);
            }
        }
    });
});

suite("Independent Coloring Test", () => {
    const independentSettings: [[{}]] =
        [
            [
                "()",
                [
                    "Gold",
                    "Orchid",
                    "LightSkyBlue",
                ],
                "Red",
            ],
            [
                "[]",
                [
                    "Gold",
                    "Orchid",
                    "LightSkyBlue",
                ],
                "Red",
            ],
            [
                "{}",
                [
                    "Gold",
                    "Orchid",
                    "LightSkyBlue",
                ],
                "Red",
            ],
        ];

    const settings = new Settings({
        languageID: "typescript",
        colorMode: ColorMode.Independent,
        independentSettings,
        timeOutLength: 0,
    });

    test("Line 1", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line0 = document.getLine(0, textDocument);

            const colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line0.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 0 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 0 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 0 &&
                    colorRangesGold[1].start.character === 5 &&
                    colorRangesGold[1].end.line === 0 &&
                    colorRangesGold[1].end.character === 6);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line0.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 2);
                assert(colorRangesOrchid[0].start.line === 0 &&
                    colorRangesOrchid[0].start.character === 1 &&
                    colorRangesOrchid[0].end.line === 0 &&
                    colorRangesOrchid[0].end.character === 2);

                assert(colorRangesOrchid[1].start.line === 0 &&
                    colorRangesOrchid[1].start.character === 4 &&
                    colorRangesOrchid[1].end.line === 0 &&
                    colorRangesOrchid[1].end.character === 5);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 2);
                assert(colorRangesLightSkyBlue[0].start.line === 0 &&
                    colorRangesLightSkyBlue[0].start.character === 2 &&
                    colorRangesLightSkyBlue[0].end.line === 0 &&
                    colorRangesLightSkyBlue[0].end.character === 3);

                assert(colorRangesLightSkyBlue[1].start.line === 0 &&
                    colorRangesLightSkyBlue[1].start.character === 3 &&
                    colorRangesLightSkyBlue[1].end.line === 0 &&
                    colorRangesLightSkyBlue[1].end.character === 4);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 2", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line1 = document.getLine(1, textDocument);

            const colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line1.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 3);
                assert(colorRangesGold[0].start.line === 1 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 1 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 1 &&
                    colorRangesGold[1].start.character === 1 &&
                    colorRangesGold[1].end.line === 1 &&
                    colorRangesGold[1].end.character === 2);

                assert(colorRangesGold[2].start.line === 1 &&
                    colorRangesGold[2].start.character === 2 &&
                    colorRangesGold[2].end.line === 1 &&
                    colorRangesGold[2].end.character === 3);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line1.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            const colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Line 3", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line2 = document.getLine(2, textDocument);

            const colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line2.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 3);
                assert(colorRangesGold[0].start.line === 2 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 2 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 2 &&
                    colorRangesGold[1].start.character === 1 &&
                    colorRangesGold[1].end.line === 2 &&
                    colorRangesGold[1].end.character === 2);

                assert(colorRangesGold[2].start.line === 2 &&
                    colorRangesGold[2].start.character === 2 &&
                    colorRangesGold[2].end.line === 2 &&
                    colorRangesGold[2].end.character === 3);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line2.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            const colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Line 4", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line3 = document.getLine(3, textDocument);

            const colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            const colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            const colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            const colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Line 5", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line4 = document.getLine(4, textDocument);

            const colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line4.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 6);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line4.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            const colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });
});

suite("Independent Coloring Test Unique Opening Color", () => {
    const independentSettings: [[{}]] =
        [
            [
                "()",
                [
                    "Gold",
                    "Orchid",
                    "LightSkyBlue",
                ],
                "Red",
            ],
            [
                "[]",
                [
                    "Gold",
                    "Orchid",
                    "LightSkyBlue",
                ],
                "Red",
            ],
            [
                "{}",
                [
                    "Gold",
                    "Orchid",
                    "LightSkyBlue",
                ],
                "Red",
            ],
        ];

    const settings = new Settings({
        languageID: "typescript",
        colorMode: ColorMode.Independent,
        forceUniqueOpeningColor: true,
        independentSettings,
        timeOutLength: 0,
    });

    test("Line 1", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line0 = document.getLine(0, textDocument);

            const colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line0.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 0 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 0 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 0 &&
                    colorRangesGold[1].start.character === 5 &&
                    colorRangesGold[1].end.line === 0 &&
                    colorRangesGold[1].end.character === 6);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line0.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 2);
                assert(colorRangesOrchid[0].start.line === 0 &&
                    colorRangesOrchid[0].start.character === 1 &&
                    colorRangesOrchid[0].end.line === 0 &&
                    colorRangesOrchid[0].end.character === 2);

                assert(colorRangesOrchid[1].start.line === 0 &&
                    colorRangesOrchid[1].start.character === 4 &&
                    colorRangesOrchid[1].end.line === 0 &&
                    colorRangesOrchid[1].end.character === 5);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
            if (colorRangesLightSkyBlue !== undefined) {
                assert.equal(colorRangesLightSkyBlue.length, 2);
                assert(colorRangesLightSkyBlue[0].start.line === 0 &&
                    colorRangesLightSkyBlue[0].start.character === 2 &&
                    colorRangesLightSkyBlue[0].end.line === 0 &&
                    colorRangesLightSkyBlue[0].end.character === 3);

                assert(colorRangesLightSkyBlue[1].start.line === 0 &&
                    colorRangesLightSkyBlue[1].start.character === 3 &&
                    colorRangesLightSkyBlue[1].end.line === 0 &&
                    colorRangesLightSkyBlue[1].end.character === 4);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 2", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line1 = document.getLine(1, textDocument);

            const colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line1.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 1);
                assert(colorRangesGold[0].start.line === 1 &&
                    colorRangesGold[0].start.character === 1 &&
                    colorRangesGold[0].end.line === 1 &&
                    colorRangesGold[0].end.character === 2);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line1.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 2);
                assert(colorRangesOrchid[0].start.line === 1 &&
                    colorRangesOrchid[0].start.character === 0 &&
                    colorRangesOrchid[0].end.line === 1 &&
                    colorRangesOrchid[0].end.character === 1);

                assert(colorRangesOrchid[1].start.line === 1 &&
                    colorRangesOrchid[1].start.character === 2 &&
                    colorRangesOrchid[1].end.line === 1 &&
                    colorRangesOrchid[1].end.character === 3);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Line 3", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line2 = document.getLine(2, textDocument);

            const colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line2.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 1);
                assert(colorRangesGold[0].start.line === 2 &&
                    colorRangesGold[0].start.character === 1 &&
                    colorRangesGold[0].end.line === 2 &&
                    colorRangesGold[0].end.character === 2);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line2.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert.equal(colorRangesOrchid.length, 2);
                assert(colorRangesOrchid[0].start.line === 2 &&
                    colorRangesOrchid[0].start.character === 0 &&
                    colorRangesOrchid[0].end.line === 2 &&
                    colorRangesOrchid[0].end.character === 1);

                assert(colorRangesOrchid[1].start.line === 2 &&
                    colorRangesOrchid[1].start.character === 2 &&
                    colorRangesOrchid[1].end.line === 2 &&
                    colorRangesOrchid[1].end.character === 3);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Line 4", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line3 = document.getLine(3, textDocument);

            const colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            const colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            const colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            const colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Line 5", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line4 = document.getLine(4, textDocument);

            const colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            const colorRangesGold = line4.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 4);
                assert(colorRangesGold[0].start.line === 4 &&
                    colorRangesGold[0].start.character === 0 &&
                    colorRangesGold[0].end.line === 4 &&
                    colorRangesGold[0].end.character === 1);

                assert(colorRangesGold[1].start.line === 4 &&
                    colorRangesGold[1].start.character === 1 &&
                    colorRangesGold[1].end.line === 4 &&
                    colorRangesGold[1].end.character === 2);

                assert(colorRangesGold[2].start.line === 4 &&
                    colorRangesGold[2].start.character === 4 &&
                    colorRangesGold[2].end.line === 4 &&
                    colorRangesGold[2].end.character === 5);

                assert(colorRangesGold[3].start.line === 4 &&
                    colorRangesGold[3].start.character === 5 &&
                    colorRangesGold[3].end.line === 4 &&
                    colorRangesGold[3].end.character === 6);
            }
            else {
                assert(false);
            }

            const colorRangesOrchid = line4.colorRanges.get("Orchid");
            if (colorRangesOrchid !== undefined) {
                assert(colorRangesOrchid[0].start.line === 4 &&
                    colorRangesOrchid[0].start.character === 2 &&
                    colorRangesOrchid[0].end.line === 4 &&
                    colorRangesOrchid[0].end.character === 3);

                assert(colorRangesOrchid[1].start.line === 4 &&
                    colorRangesOrchid[1].start.character === 3 &&
                    colorRangesOrchid[1].end.line === 4 &&
                    colorRangesOrchid[1].end.character === 4);
            }
            else {
                assert(false);
            }

            const colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });
});

suite("Comment and quote", () => {
    const consecutiveSettings: [{}] = [
        "()",
        "[]",
        "{}",
        [
            "Gold",
            "Orchid",
            "LightSkyBlue",
        ],
        "Red",
    ];

    const settings = new Settings({
        languageID: "typescript",
        colorMode: ColorMode.Consecutive,
        consecutiveSettings,
        timeOutLength: 0,
    });

    test("Line 5", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line5 = document.getLine(5, textDocument);

            const colorRangesGold = line5.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);
        }
    });

    test("Line 6", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line6 = document.getLine(6, textDocument);

            const colorRangesGold = line6.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 7", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line7 = document.getLine(7, textDocument);

            const colorRangesGold = line7.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);
        }
    });

    test("Line 8", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line8 = document.getLine(8, textDocument);

            const colorRangesGold = line8.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);
        }
    });

    test("Line 9", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line9 = document.getLine(9, textDocument);

            const colorRangesGold = line9.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);
        }
    });

    test("Line 10", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line10 = document.getLine(10, textDocument);

            const colorRangesGold = line10.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 10 &&
                    colorRangesGold[0].start.character === 6 &&
                    colorRangesGold[0].end.line === 10 &&
                    colorRangesGold[0].end.character === 7);

                assert(colorRangesGold[1].start.line === 10 &&
                    colorRangesGold[1].start.character === 7 &&
                    colorRangesGold[1].end.line === 10 &&
                    colorRangesGold[1].end.character === 8);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 11", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line11 = document.getLine(11, textDocument);

            const colorRangesGold = line11.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);
        }
    });

    test("Line 12", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line12 = document.getLine(12, textDocument);

            const colorRangesGold = line12.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 12 &&
                    colorRangesGold[0].start.character === 2 &&
                    colorRangesGold[0].end.line === 12 &&
                    colorRangesGold[0].end.character === 3);

                assert(colorRangesGold[1].start.line === 12 &&
                    colorRangesGold[1].start.character === 3 &&
                    colorRangesGold[1].end.line === 12 &&
                    colorRangesGold[1].end.character === 4);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 13", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line13 = document.getLine(13, textDocument);

            const colorRangesGold = line13.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);
        }
    });

    test("Line 14", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line12 = document.getLine(14, textDocument);

            const colorRangesGold = line12.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 14 &&
                    colorRangesGold[0].start.character === 3 &&
                    colorRangesGold[0].end.line === 14 &&
                    colorRangesGold[0].end.character === 4);

                assert(colorRangesGold[1].start.line === 14 &&
                    colorRangesGold[1].start.character === 4 &&
                    colorRangesGold[1].end.line === 14 &&
                    colorRangesGold[1].end.character === 5);
            }
            else {
                assert(false);
            }
        }
    });
});

suite("Typescript contextural parsing", () => {
    const consecutiveSettings: [{}] = [
        "()",
        "[]",
        "{}",
        [
            "Gold",
            "Orchid",
            "LightSkyBlue",
        ],
        "Red",
    ];

    const settings = new Settings({
        languageID: "typescript",
        contextualParsing: true,
        colorMode: ColorMode.Consecutive,
        consecutiveSettings,
        timeOutLength: 0,
    });

    test("Line 15", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line15 = document.getLine(15, textDocument);

            const colorRangesGold = line15.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 15 &&
                    colorRangesGold[0].start.character === 13 &&
                    colorRangesGold[0].end.line === 15 &&
                    colorRangesGold[0].end.character === 14);

                assert(colorRangesGold[1].start.line === 15 &&
                    colorRangesGold[1].start.character === 14 &&
                    colorRangesGold[1].end.line === 15 &&
                    colorRangesGold[1].end.character === 15);
            }
            else {
                assert(false);
            }
        }
    });

    test("Line 16", () => {
        {
            const textDocument = vscode.window.activeTextEditor!.document;
            const document = new DocumentDecoration(textDocument, settings);
            document.triggerUpdateDecorations();
            const line16 = document.getLine(16, textDocument);

            const colorRangesGold = line16.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 2);
                assert(colorRangesGold[0].start.line === 16 &&
                    colorRangesGold[0].start.character === 8 &&
                    colorRangesGold[0].end.line === 16 &&
                    colorRangesGold[0].end.character === 9);

                assert(colorRangesGold[1].start.line === 16 &&
                    colorRangesGold[1].start.character === 9 &&
                    colorRangesGold[1].end.line === 16 &&
                    colorRangesGold[1].end.character === 10);
            }
            else {
                assert(false);
            }
        }
    });
});
