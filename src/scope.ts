import Match from "./match";
import MatchLogic from "./matchLogic";

export default class Scope {
    private opener: Match;
    private intermediate: Match | undefined;
    private closer: Match | undefined;
}