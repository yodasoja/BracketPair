import Uri from "vscode-uri";

export default class GutterIconManager {
    private fs = require("fs");
    private tmp = require("tmp");
    private escape = require("escape-html");

    private iconDict = new Map<string, Map<string, Uri>>();
    private disposables = new Array<{ (): void }>();

    public Dispose() {
        this.disposables.forEach((callback) => {
            callback();
        });

        this.disposables = [];
    }

    public GetIconUri(bracket: string, color: string, fontFamily: string): Uri {
        const colorDict = this.iconDict.get(bracket);

        if (colorDict) {
            const uri = colorDict.get(color);
            if (uri) {
                return uri;
            }
            else {
                const newUri = this.createIcon(color, bracket, fontFamily);
                colorDict.set(color, newUri);
                return newUri;
            }
        }
        else {
            const newUri = this.createIcon(color, bracket, fontFamily);
            const dict = new Map<string, Uri>();
            dict.set(color, newUri);
            this.iconDict.set(bracket, dict);
            return newUri;
        }
    }

    // private getUri(color: string, bracket: string) {
    //     const icon = this.createIcon(color, bracket);
    //     const tmpobj = this.tmp.fileSync();
    //     const filePath = this.tmp.fileSync().name as string;
    //     const encode = this.PImage.encodePNGToStream(icon, this.fs.createWriteStream(filePath)) as Promise<void>;
    //     return encode.then(() => {
    //         this.disposables.push(tmpobj.removeCallback);
    //         return Uri.file(filePath);
    //     });
    // }

    private createIcon(color: string, bracket: string, fontFamily: string): Uri {
        const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10">` +
            `<text x="50%" y="50%" fill="${color}" font-family="${fontFamily}" font-size="10" ` +
            `text-anchor="middle" dominant-baseline="middle">` +
            `${this.escape(bracket)}` +
            `</text>` +
            `</svg>`;

        const encodedSVG = encodeURIComponent(svg);

        const URI = "data:image/svg+xml;utf8," + encodedSVG;

        return Uri.parse(URI);
    }
}
