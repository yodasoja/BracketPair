//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import Settings from "../src/settings";
import ColorMode from "../src/colorMode";
import DocumentDecoration from "../src/DocumentDecoration";

// Defines a Mocha test suite to group tests of similar kind together
suite("Settings Tests", () => {

    // Defines a Mocha unit test
    test("bracketPairColorizer.timeOut", () => {
        let settings = new Settings(0);
        assert.equal(settings.timeOutLength, 0);
    });

    test("bracketPairColorizer.forceUniqueOpeningColor", () => {
        let settings = new Settings(undefined, true);
        assert.equal(settings.forceUniqueOpeningColor, true);

        settings = new Settings(undefined, false);
        assert.equal(settings.forceUniqueOpeningColor, false);
    });

    test("bracketPairColorizer.forceIterationColorCycle", () => {
        let settings = new Settings(undefined, undefined, true);
        assert.equal(settings.forceIterationColorCycle, true);

        settings = new Settings(undefined, undefined, false);
        assert.equal(settings.forceIterationColorCycle, false);
    });

    test("bracketPairColorizer.colorMode", () => {
        let settings = new Settings(undefined, undefined, undefined, ColorMode.Independent);
        assert.equal(settings.colorMode, ColorMode.Independent);

        settings = new Settings(undefined, undefined, undefined, ColorMode.Consecutive);
        assert.equal(settings.colorMode, ColorMode.Consecutive);
    });

    test("bracketPairColorizer.consecutivePairColors", () => {
        let consecutiveSettings: [{}] = ["ab", "cd", ["color0", "color1"], "orphanColor"];

        let settings = new Settings(undefined, undefined, undefined, ColorMode.Consecutive, consecutiveSettings);
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

    test("bracketPairColorizer.independentPairColors", () => {
        let independentSettings: [[{}]] =
            [
                [
                    "ab",
                    [
                        "color0",
                        "color1",
                    ],
                    "orphanColor0"
                ],
                [
                    "cd",
                    [
                        "color2",
                        "color3",
                    ],
                    "orphanColor1"
                ]
            ];

        let settings = new Settings(0, false, false, ColorMode.Independent, undefined, independentSettings);
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

    // TODO Why is bracketPairs undefined in this test? Outside of tests it works...
    // test("Default Settings", () => {
    //     let settings = new Settings();
    //     assert.equal(settings.timeOutLength, 200);
    //     assert.equal(settings.forceUniqueOpeningColor, false);
    //     assert.equal(settings.forceIterationColorCycle, false);
    //     assert.equal(settings.colorMode, ColorMode.Consecutive);

    //     assert.equal(settings.bracketPairs.length, 3);
    //     assert.equal(settings.bracketPairs[0].openCharacter, "(");
    //     assert.equal(settings.bracketPairs[0].closeCharacter, ")");
    //     assert.equal(settings.bracketPairs[1].openCharacter, "[");
    //     assert.equal(settings.bracketPairs[1].closeCharacter, "]");
    //     assert.equal(settings.bracketPairs[2].openCharacter, "{");
    //     assert.equal(settings.bracketPairs[2].closeCharacter, "}");

    //     assert.equal(settings.bracketPairs[0].colors[0], "Gold");
    //     assert.equal(settings.bracketPairs[0].colors[1], "Orchid");
    //     assert.equal(settings.bracketPairs[0].colors[2], "LightSkyBlue");
    //     assert.equal(settings.bracketPairs[1].colors[0], "Gold");
    //     assert.equal(settings.bracketPairs[1].colors[1], "Orchid");
    //     assert.equal(settings.bracketPairs[1].colors[2], "LightSkyBlue");
    //     assert.equal(settings.bracketPairs[2].colors[0], "Gold");
    //     assert.equal(settings.bracketPairs[2].colors[1], "Orchid");
    //     assert.equal(settings.bracketPairs[2].colors[2], "LightSkyBlue");

    //     assert.equal(settings.bracketPairs[0].orphanColor, "Red");
    //     assert.equal(settings.bracketPairs[1].orphanColor, "Red");
    //     assert.equal(settings.bracketPairs[2].orphanColor, "Red");
    // });
});

suite("Consecutive Coloring Test", () => {
    let settings = new Settings(0, false, false, ColorMode.Consecutive,
        [
            "()",
            "[]",
            "{}",
            [
                "Gold",
                "Orchid",
                "LightSkyBlue"
            ],
            "Red"
        ]);

    test("First Line Document Consecutive Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line0 = document.getLine(0);

            let colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line0.colorRanges.get("Gold");
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

            let colorRangesOrchid = line0.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
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

    test("Second Line Document Consecutive Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line1 = document.getLine(1);

            let colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line1.colorRanges.get("Gold");
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

            let colorRangesOrchid = line1.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
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

    test("Third Line Document Consecutive Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line2 = document.getLine(2);

            let colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line2.colorRanges.get("Gold");
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

            let colorRangesOrchid = line2.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
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

    test("Fourth Line Document Consecutive Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line3 = document.getLine(3);

            let colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            let colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            let colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            let colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Fifth Line Document Consecutive Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line4 = document.getLine(4);

            let colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line4.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 6);
            }
            else {
                assert(false);
            }

            let colorRangesOrchid = line4.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            let colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });
});

suite("Consecutive Coloring Test Unique Opening Color", () => {
    let settings = new Settings(0, true, false, ColorMode.Consecutive,
        [
            "()",
            "[]",
            "{}",
            [
                "Gold",
                "Orchid",
                "LightSkyBlue"
            ],
            "Red"
        ]);

    test("First Line Document Consecutive Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line0 = document.getLine(0);

            let colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line0.colorRanges.get("Gold");
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

            let colorRangesOrchid = line0.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
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

    test("Second Line Document Consecutive Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line1 = document.getLine(1);

            let colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line1.colorRanges.get("Gold");
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

            let colorRangesOrchid = line1.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
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

    test("Third Line Document Consecutive Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line2 = document.getLine(2);

            let colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line2.colorRanges.get("Gold");
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

            let colorRangesOrchid = line2.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
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

    test("Fourth Line Document Consecutive Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line3 = document.getLine(3);

            let colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            let colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            let colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            let colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Fifth Line Document Consecutive Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line4 = document.getLine(4);

            let colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line4.colorRanges.get("Gold");
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

            let colorRangesOrchid = line4.colorRanges.get("Orchid");
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


            let colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });
});

suite("Consecutive Coloring Test Force Iteration Color Cycle", () => {
    let settings = new Settings(0, false, true, ColorMode.Consecutive,
        [
            "()",
            "[]",
            "{}",
            [
                "Gold",
                "Orchid",
                "LightSkyBlue"
            ],
            "Red"
        ]);

    test("First Line Document Consecutive Force Iteration Color Cycle", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line0 = document.getLine(0);

            let colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line0.colorRanges.get("Gold");
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

            let colorRangesOrchid = line0.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
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

    test("Second Line Document Consecutive Force Iteration Color Cycle", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line1 = document.getLine(1);

            let colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line1.colorRanges.get("Gold");
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

            let colorRangesOrchid = line1.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
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

    test("Third Line Document Consecutive Force Iteration Color Cycle", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line2 = document.getLine(2);

            let colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line2.colorRanges.get("Gold");
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

            let colorRangesOrchid = line2.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
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

    test("Fourth Line Document Consecutive Force Iteration Color Cycle", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line3 = document.getLine(3);

            let colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            let colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            let colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            let colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Fifth Line Document Consecutive Coloring Force Iteration Color Cycle", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line4 = document.getLine(4);

            let colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line4.colorRanges.get("Gold");
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

            let colorRangesOrchid = line4.colorRanges.get("Orchid");
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


            let colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
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
    let settings = new Settings(0, false, false, ColorMode.Independent,
        [
            "()",
            "[]",
            "{}",
            [
                "Gold",
                "Orchid",
                "LightSkyBlue"
            ],
            "Red"
        ]);

    test("First Line Document Independent Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line0 = document.getLine(0);

            let colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line0.colorRanges.get("Gold");
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

            let colorRangesOrchid = line0.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
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

    test("Second Line Document Independent Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line1 = document.getLine(1);

            let colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line1.colorRanges.get("Gold");
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

            let colorRangesOrchid = line1.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);


            let colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Third Line Document Independent Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line2 = document.getLine(2);

            let colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line2.colorRanges.get("Gold");
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

            let colorRangesOrchid = line2.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);


            let colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Fourth Line Document Independent Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line3 = document.getLine(3);

            let colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            let colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            let colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            let colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Fifth Line Document Independent Coloring", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line4 = document.getLine(4);

            let colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line4.colorRanges.get("Gold");
            if (colorRangesGold !== undefined) {
                assert.equal(colorRangesGold.length, 6);
            }
            else {
                assert(false);
            }

            let colorRangesOrchid = line4.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            let colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });
});

suite("Independent Coloring Test Unique Opening Color", () => {
    let settings = new Settings(0, true, false, ColorMode.Independent,
        [
            "()",
            "[]",
            "{}",
            [
                "Gold",
                "Orchid",
                "LightSkyBlue"
            ],
            "Red"
        ]);

    test("First Line Document Independent Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line0 = document.getLine(0);

            let colorRangesError = line0.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line0.colorRanges.get("Gold");
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

            let colorRangesOrchid = line0.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line0.colorRanges.get("LightSkyBlue");
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

    test("Second Line Document Independent Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line1 = document.getLine(1);

            let colorRangesError = line1.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line1.colorRanges.get("Gold");
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

            let colorRangesOrchid = line1.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line1.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Third Line Document Independent Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line2 = document.getLine(2);

            let colorRangesError = line2.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line2.colorRanges.get("Gold");
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

            let colorRangesOrchid = line2.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line2.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Fourth Line Document Independent Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line3 = document.getLine(3);

            let colorRangesError = line3.colorRanges.get("Red");
            if (colorRangesError !== undefined) {
                assert.equal(colorRangesError.length, 1);
            }
            else {
                assert(false);
            }

            let colorRangesGold = line3.colorRanges.get("Gold");
            assert.equal(colorRangesGold, undefined);

            let colorRangesOrchid = line3.colorRanges.get("Orchid");
            assert.equal(colorRangesOrchid, undefined);

            let colorRangesLightSkyBlue = line3.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });

    test("Fifth Line Document Independent Coloring Unique Opening Color", () => {
        {
            let document = new DocumentDecoration(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line4 = document.getLine(4);

            let colorRangesError = line4.colorRanges.get("Red");
            assert.equal(colorRangesError, undefined);

            let colorRangesGold = line4.colorRanges.get("Gold");
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

            let colorRangesOrchid = line4.colorRanges.get("Orchid");
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

            let colorRangesLightSkyBlue = line4.colorRanges.get("LightSkyBlue");
            assert.equal(colorRangesLightSkyBlue, undefined);
        }
    });
});