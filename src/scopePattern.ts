import Match from "./match";
import ScopeCharacter from "./scopeCharacter";

export default class ScopePattern {
    public readonly opener: ScopeCharacter;
    public readonly closer: ScopeCharacter | undefined;

    constructor(opener: ScopeCharacter, closer?: ScopeCharacter) {
        this.opener = opener;
        this.closer = closer;
    }
}
