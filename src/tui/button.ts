import { BoxRenderable, CliRenderer, MouseEvent, TextRenderable } from "@opentui/core";

export class TuiButton {
    private label: TextRenderable;
    box: BoxRenderable;
    
    pressed: boolean;
    mouseOver: boolean;

    constructor(renderer: CliRenderer, label: string) {
        this.box = new BoxRenderable(renderer, {
            width: label.length + 2,
            height: 3,
            backgroundColor: "#454545",
            alignItems: "center",
            justifyContent: "center",
            onMouseDown: (event) => this.onDown(event),
            onMouseUp: (event) => this.onUp(event),
            onMouseOver: (event) => this.onUp(event)
        });

        this.label = new TextRenderable(renderer, {
            content: label,
            fg: "#ffffff"
        });

        this.box.add(this.label);
    }

    private onDown(event: MouseEvent) {
        this.box.backgroundColor = "#282828";
        this.pressed = true;
    }

    private onUp(event: MouseEvent) {
        this.box.backgroundColor = "#454545";
        this.pressed = false;
    }

    private onMouseOut(event: MouseEvent)
}