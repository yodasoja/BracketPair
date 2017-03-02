export default class ScopeCharacter {
    public readonly match: string;
    public readonly escapeCharacter: string;
    public readonly mustNotStartWith: string[];
    public readonly mustNotEndWith: string[];

    constructor(
        match: string,
        options?: {
            escapeCharacter?: string,
            mustNotStartWith?: string[],
            mustNotEndWith?: string[],
        }) {
        this.match = match;
        if (options) {
            this.escapeCharacter = options.escapeCharacter || "";
            this.mustNotStartWith = options.mustNotStartWith || [];
            this.mustNotStartWith = options.mustNotEndWith || [];
        }
        else {
            this.escapeCharacter = "";
            this.mustNotStartWith = [];
            this.mustNotEndWith = [];
        }
    }
}
