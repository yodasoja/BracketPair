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

// Defines a Mocha test suite to group tests of similar kind together
suite("Settings Tests", () => {

    // Defines a Mocha unit test
    test("bracketPairColorizer.timeOut", () => {
        let settings = new Settings(200);
        assert.equal(settings.timeOutLength, 200);
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
});