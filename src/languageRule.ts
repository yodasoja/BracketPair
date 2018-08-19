// tslint:disable:max-classes-per-file

export default class LanguageRule {
    public languageId: string;
    // public baseLanguageRule: string | undefined;
    public languageTokens = new Map<string, LanguageAgnosticToken[]>();

    constructor() {

    }

    public get(languageId: string, suffix: string) {
        const tokens = this.languageTokens.get(languageId);

        if (tokens) {

            const typeMap = new Map<string, string>();

            for (const token of tokens) {
                typeMap.set(token.tokenOpen + suffix, token.commonToken);
                if (token.tokenClose) {
                    typeMap.set(token.tokenClose + suffix, token.commonToken);
                }
            }

            return typeMap;
        }

        throw new Error("No rule for language: " + languageId);
    }

    public initTypescript() {
        const base = this.languageTokens.get("javascript");
        if (base) {
            this.languageTokens.set("javascript", base);
        }
        else {
            console.warn("Base language not found");
        }
    }

    public initJavascript() {
        const brace = new LanguageAgnosticToken("meta.brace.round.ts");
        const parameters = new LanguageAgnosticToken(
            "punctuation.definition.parameters.begin.ts",
            "punctuation.definition.parameters.end.ts",
        );
        const square = new LanguageAgnosticToken("meta.brace.square.ts");
        const block = new LanguageAgnosticToken("punctuation.definition.block.ts");

        this.languageTokens.set("javascript", [brace, parameters, square, block]);
    }
}

class LanguageAgnosticToken {
    public readonly commonToken: string;
    public tokenOpen: string;
    public tokenClose?: string;
    constructor(tokenOpen: string, tokenClose?: string) {
        const openSplit = tokenOpen.split(".");
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
