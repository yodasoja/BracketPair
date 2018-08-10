import { Range } from "vscode";
import TextLine from "./textLine";
import Token from "./token";

export default class Bracket {
    public readonly token: Token;
    public readonly colorIndex: number;
    public pair?: Bracket;

    constructor(token: Token, colorIndex: number) {
        this.token = token;
        this.colorIndex = colorIndex;
    }
}
