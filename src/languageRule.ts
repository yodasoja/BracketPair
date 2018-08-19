// tslint:disable:max-classes-per-file

export default class LanguageRule {
    public languageId: string;
    // public baseLanguageRule: string | undefined;
    public languageTokens: LanguageToken[] = [];

    public build() {
        const commonTokens = this.languageTokens.map((e) => new LanguageAgnosticToken(e));
    }

    public initTypescript() {
        // User input from settings json
        const brace = new LanguageToken("meta.brace.round.ts");
        const parameters = new LanguageToken(
            "punctuation.definition.parameters.begin.ts",
            "punctuation.definition.parameters.end.ts",
        );
        const square = new LanguageToken("meta.brace.square.ts");
        const block = new LanguageToken("punctuation.definition.block.ts");

        this.languageTokens = [brace, parameters, square, block];
    }
}

class LanguageToken {
    public tokenOpen: string;
    public tokenClose?: string;

    constructor(tokenOpen: string, tokenClose?: string) {
        this.tokenOpen = tokenOpen;
        this.tokenClose = tokenClose;
    }
}

class LanguageAgnosticToken {
    public readonly type: string;
    public readonly languageToken: LanguageToken;
    constructor(languageToken: LanguageToken) {
        this.languageToken = languageToken;
        const openNoSuffix = languageToken.tokenOpen.split(".").slice(0, -1).join(".");

        if (languageToken.tokenClose) {
            const closeSplit = languageToken.tokenClose.split(".");
            closeSplit.pop();


        }
        else {
            this.type = openNoSuffix;
        }
    }
}
