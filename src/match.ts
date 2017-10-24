import ScopeCharacter from "./scopeCharacter";

export default class Match {
    public static contains(content: string, position: number, character: ScopeCharacter): boolean {
        return (
            this.checkMatch(content, position, character) &&
            this.checkOffsetCondition(content, position, character));
    }

    private static checkMatch(content: string, position: number, character: ScopeCharacter): boolean {
        return content.substr(position, character.match.length) === character.match
            && this.isNotEscaped(content, position, character);
    }

    private static isNotEscaped(content: string, position: number, character: ScopeCharacter): boolean {
        if (!character.escapeCharacter) {
            return true;
        }

        let counter = 0;
        position -= character.escapeCharacter.length;
        while (
            position > 0 &&
            content.substr(position, character.escapeCharacter.length) === character.escapeCharacter
        ) {
            position -= character.escapeCharacter.length;
            counter++;
        }

        return counter % 2 === 0;
    }

    private static checkOffsetCondition(content: string, postion: number, character: ScopeCharacter): boolean {
        if (character.mustMatchAtOffset) {
            for (const matchCondition of character.mustMatchAtOffset) {
                const checkPosition = postion + matchCondition.offset;

                if (checkPosition < 0) {
                    return false;
                }

                if (!this.checkMatch(content, checkPosition, matchCondition.character)) {
                    return false;
                }
            }
        }

        if (character.mustNotMatchAtOffset) {
            for (const matchCondition of character.mustNotMatchAtOffset) {
                const checkPosition = postion + matchCondition.offset;

                if (checkPosition >= 0 && this.checkMatch(content, checkPosition, matchCondition.character)) {
                    return false;
                }
            }
        }

        return true;
    }
}
