abstract class MatchLogic {
    private readonly content: string;
    constructor(content: string) {
        this.content = content;
    }

    public checkMatch(position: number): boolean {
        return true;
    }

    private checkPreCondition(position: number): boolean {
        return true;
    }

    private checkPostCondition(position: number): boolean {
        return true;
    }
}

export default MatchLogic;
