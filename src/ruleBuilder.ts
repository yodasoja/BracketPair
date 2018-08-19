import LanguageRule from "./languageRule";

export default class RuleBuilder {
    private rules = new Map<string, Set<string>>();

    constructor() {
        const javascript = new LanguageRule();
        javascript.languageId = "javascript";
    }

    public getRules(languageId: string) {
        const rule = this.rules.get(languageId);

        if (rule) {
            return rule;
        }
    }
}
