import { BoxRenderable, CliRenderer, TextRenderable } from "@opentui/core";

export class TuiButton {
    private label: TextRenderable;
    private box: BoxRenderable;

    constructor(renderer: CliRenderer, label: string) {
        this.box = new BoxRenderable(renderer, {
            width: label.length + 2,
            height: 3,
            backgroundColor: "#454545",
            alignItems: "center",
            justifyContent: "center"
        });

        this.label = new TextRenderable(renderer, {
            content: label,
            fg: "#ffffff"
        });

        this.box.add(this.label);
    }

    addTo(target: BoxRenderable) {
        target.add(this.box);
    }
}