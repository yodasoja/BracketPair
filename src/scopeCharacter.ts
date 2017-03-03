export default class ScopeCharacter {
    public readonly match: string;
    public readonly escapeCharacter: string | undefined;
    public readonly mustMatchAtOffset: Array<{ offset: number, character: ScopeCharacter }> | undefined;
    public readonly mustNotMatchAtOffset: Array<{ offset: number, character: ScopeCharacter }> | undefined;

    constructor(
        match: string,
        options?: {
            escapeCharacter?: string,
            mustMatchAtOffset?: Array<{ offset: number, character: ScopeCharacter }>,
            mustNotMatchAtOffset?: Array<{ offset: number, character: ScopeCharacter }>,
        }) {
        this.match = match;
        if (options) {
            this.escapeCharacter = options.escapeCharacter;
            this.mustMatchAtOffset = options.mustMatchAtOffset;
            this.mustNotMatchAtOffset = options.mustNotMatchAtOffset;
        }
    }
}
