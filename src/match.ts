export default class Match {
    public readonly content: string;
    public readonly match: string;
    public readonly escapeCharacter: string;
    public readonly mustNotStartWith: string[];
    public readonly mustNotEndWith: string[];

    constructor(
        content: string,
        match: string,
        options: {
            escapeCharacter?: string,
            mustNotStartWith?: string[],
            mustNotEndWith?: string[],
        }) {

        this.content = content;
        this.match = match;

        if (options) {
            this.escapeCharacter = options.escapeCharacter || "";
            this.mustNotStartWith = options.mustNotStartWith || [];
            this.mustNotStartWith = options.mustNotEndWith || [];
        }
    }

    public isMatched(position: number): boolean {
        return (
            this.checkMatch(position) &&
            this.checkPreCondition(position) &&
            this.checkPostCondition(position + this.match.length));
    }

    private checkMatch(position: number): boolean {
        return this.content.substr(position, this.escapeCharacter.length) === this.escapeCharacter
            && this.isNotEscaped(position);
    }

    private checkPreCondition(position: number): boolean {
        if (position === 0) {
            return true;
        }

        this.mustNotStartWith.forEach((element) => {
            const offsetPosition = position - element.length;
            if (
                offsetPosition >= 0 &&
                this.content.substr(offsetPosition, element.length) === element &&
                this.isNotEscaped(position)) {
                return false;
            }
        });

        return true;
    }

    private checkPostCondition(position: number): boolean {
        if (position === this.content.length - 1) {
            return true;
        }

        this.mustNotEndWith.forEach((element) => {
            if (
                this.content.substr(position, element.length) === element &&
                this.isNotEscaped(position)) {
                return false;
            }
        });

        return true;
    }

    private isNotEscaped(position: number): boolean {
        let counter = 0;
        position -= this.escapeCharacter.length;
        while (position > 0 && this.content.substr(position, this.escapeCharacter.length) === this.escapeCharacter) {
            position -= this.escapeCharacter.length;
            counter++;
        }

        return counter % 2 === 0;
    }
}
