import { BoxRenderable, CliRenderer, MouseEvent, TextRenderable } from "@opentui/core";

export class TuiButton {
    private label: TextRenderable;
    box: BoxRenderable;

    constructor(renderer: CliRenderer, label: string) {
        this.box = new BoxRenderable(renderer, {
            width: label.length + 2,
            height: 3,
            backgroundColor: "#454545",
            alignItems: "center",
            justifyContent: "center",
            onMouseDown: (event) => this.onMouseDown(event),
            onMouseUp: (event) => this.onMouseUp(event)
        });

        this.label = new TextRenderable(renderer, {
            content: label,
            fg: "#ffffff"
        });

        this.box.add(this.label);
    }

    private onMouseDown(event: MouseEvent) {
        this.box.backgroundColor = "#282828";
    }

    private onMouseUp(event: MouseEvent) {
        this.box.backgroundColor = "#454545";
    }
}