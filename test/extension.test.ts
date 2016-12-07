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
import Document from "../src/Document";

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

        let settings = new Settings(undefined, undefined, undefined, ColorMode.Consecutive, consecutiveSettings)
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

        let settings = new Settings(undefined, undefined, undefined, ColorMode.Independent, undefined, independentSettings);
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

suite("Coloring Test", () => {
    test("Document Consecutive Coloring", () => {
        {
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

            let document = new Document(vscode.window.activeTextEditor.document.uri.toString(), settings);
            document.triggerUpdateDecorations();
            let line0 = document.getLine(0);
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
});