import ScopeCharacter from "./scopeCharacter";

export default class Match {
    public readonly content: string;

    constructor(content: string) {
        this.content = content;
    }

    public contains(position: number, character: ScopeCharacter): boolean {
        return (
            this.checkMatch(position, character) &&
            this.checkOffsetCondition(position, character));
    }

    private checkMatch(position: number, character: ScopeCharacter): boolean {
        return this.content.substr(position, character.match.length) === character.match
            && this.isNotEscaped(position, character);
    }

    private isNotEscaped(position: number, character: ScopeCharacter): boolean {
        if (!character.escapeCharacter) {
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

    private checkOffsetCondition(postion: number, character: ScopeCharacter): boolean {
        if (character.mustMatchAtOffset) {
            character.mustMatchAtOffset.forEach((matchCondition) => {
                const checkPosition = postion + matchCondition.offset;

                if (checkPosition < 0) {
                    return false;
                }

                if (!this.checkMatch(checkPosition, character)) {
                    return false;
                }
            });
        }

        if (character.mustNotMatchAtOffset) {
            character.mustNotMatchAtOffset.forEach((matchCondition) => {
                const checkPosition = postion + matchCondition.offset;

                if (checkPosition >= 0 && this.checkMatch(checkPosition, character)) {
                    return false;
                }
            });
        }

        return true;
    }
}
