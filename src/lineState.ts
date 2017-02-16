import BracketPair from "./bracketPair";
import ColorMode from "./colorMode";
import ColorIndexes from "./IColorIndexes";
import MultiLineState from "./multiLineState";
import MultipleIndexes from "./MultipleIndexes";
import Settings from "./settings";
import SingularIndex from "./singularIndex";

export default class LineState {
    public isLineCommented = false;
    public readonly multiLineState: MultiLineState;
    private readonly settings: Settings;

    constructor(
        settings: Settings,
        multiLineState?: MultiLineState) {
        this.settings = settings;

        if (multiLineState !== undefined) {
            this.multiLineState = multiLineState;
        }
        else {
            this.multiLineState = new MultiLineState(settings);
        }
    }

    public getOpenBracketColor(bracketPair: BracketPair): string {
        return this.multiLineState.getOpenBracketColor(bracketPair);
    };

    public getCloseBracketColor(bracketPair: BracketPair): string {
        return this.multiLineState.getCloseBracketColor(bracketPair);
    }

    public CloneMultiLineState(): MultiLineState {
        return this.multiLineState.clone();
    }

    public isQuoted(): boolean {
        return this.multiLineState.isQuoted();
    }

    public isMultiLineCommented(): boolean {
        return this.multiLineState.isCommented();
    }
}
