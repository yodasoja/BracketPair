import ScopeCharacter from "./scopeCharacter";

export default class Match {
    public readonly content: string;

    constructor(content: string) {
        this.content = content;
    }

    public contains(position: number, character: ScopeCharacter): boolean {
        return (
            this.checkMatch(position, character) &&
            this.checkPreCondition(position, character) &&
            this.checkPostCondition(position + character.match.length, character));
    }

    private checkMatch(position: number, character: ScopeCharacter): boolean {
        return this.content.substr(position, character.match.length) === character.match
            && this.isNotEscaped(position, character);
    }

    private checkPreCondition(position: number, character: ScopeCharacter): boolean {
        if (position === 0) {
            return true;
        }

        character.mustNotStartWith.forEach((element) => {
            const offsetPosition = position - element.length;
            if (
                offsetPosition >= 0 &&
                this.content.substr(offsetPosition, element.length) === element &&
                this.isNotEscaped(position, character)) {
                return false;
            }
        });

        return true;
    }

    private checkPostCondition(position: number, character: ScopeCharacter): boolean {
        if (position === this.content.length - 1) {
            return true;
        }

        character.mustNotEndWith.forEach((element) => {
            if (
                this.content.substr(position, element.length) === element &&
                this.isNotEscaped(position, character)) {
                return false;
            }
        });

        return true;
    }

    private isNotEscaped(position: number, character: ScopeCharacter): boolean {
        if (character.escapeCharacter.length === 0) {
            return true;
        }

        let counter = 0;
        position -= character.escapeCharacter.length;
        while (
            position > 0 &&
            this.content.substr(position, character.escapeCharacter.length) === character.escapeCharacter
        ) {
            position -= character.escapeCharacter.length;
            counter++;
        }

        return counter % 2 === 0;
    }
}
