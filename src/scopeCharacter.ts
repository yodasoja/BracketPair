export default class ScopeCharacter {
    public readonly match: string;
    public readonly escapeCharacter: string | undefined;
    public readonly mustNotStartWith: string[];
    public readonly mustNotEndWith: string[];

    constructor(
        match: string,
        options?: {
            escapeCharacter?: string,
            mustNotStartWith?: string[],
            mustNotEndWith?: string[],
            customLogic?: (content: string, position: number) => boolean;
        }) {
        this.match = match;
        if (options) {
            this.escapeCharacter = options.escapeCharacter;
            this.mustNotStartWith = options.mustNotStartWith || [];
            this.mustNotEndWith = options.mustNotEndWith || [];
        }
        else {
            this.mustNotStartWith = [];
            this.mustNotEndWith = [];
        }
    }
}
