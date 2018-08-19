// tslint:disable:max-classes-per-file

export default class LanguageRule {
    public languageId: string;
    // public baseLanguageRule: string | undefined;
    public languageTokens: LanguageAgnosticToken[] = [];

    public build() {
        const map = new Map<string, string>();

        for (const token of this.languageTokens) {
            map.set(token.tokenOpen + token.suffix, token.commonToken);
            if (token.tokenClose) {
                map.set(token.tokenClose + token.suffix, token.commonToken);
            }
        }

        return map;
    }

    public initTypescript() {
        // User input from settings json
        const brace = new LanguageAgnosticToken("meta.brace.round.ts");
        const parameters = new LanguageAgnosticToken(
            "punctuation.definition.parameters.begin.ts",
            "punctuation.definition.parameters.end.ts",
        );
        const square = new LanguageAgnosticToken("meta.brace.square.ts");
        const block = new LanguageAgnosticToken("punctuation.definition.block.ts");

        this.languageTokens = [brace, parameters, square, block];
    }
}

class LanguageAgnosticToken {
    public readonly commonToken: string;
    public tokenOpen: string;
    public tokenClose?: string;
    public readonly suffix: string;
    constructor(tokenOpen: string, tokenClose?: string) {
        const openSplit = tokenOpen.split(".");
        this.suffix = "." + openSplit.pop();
        this.tokenOpen = openSplit.join(".");

        if (tokenClose) {
            const closeSplit = tokenClose.split(".");
            closeSplit.pop();
            this.tokenClose = closeSplit.join(".");

            if (openSplit.length !== closeSplit.length) {
                throw new Error("Open and Close tokens are not same type");
            }

            let i = 0;
            for (; i < openSplit.length; i++) {
                if (openSplit[i] !== closeSplit[i]) {
                    break;
                }
            }

            openSplit.splice(i);
        }

        this.commonToken = openSplit.join(".");
    }
}
