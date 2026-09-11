import {
  BoxRenderable,
  CliRenderer,
  createCliRenderer,
  InputRenderable,
} from "@opentui/core";
import { TuiButton } from "./button";

export class Tui {
  private renderer!: CliRenderer;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;
  }

  static async create() {
    const renderer = await createCliRenderer({
      exitOnCtrlC: true,
    });

    return new Tui(renderer);
  }

  async runTui() {
    const box = new BoxRenderable(this.renderer, {
      width: "100%",
      height: "100%",
      backgroundColor: "#252525",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: 1,
    });

    const promptBar = new BoxRenderable(this.renderer, {
      width: "100%",
      height: 3,
      backgroundColor: "#1c1c1c",
      alignSelf: "flex-end",
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-start",
      //padding: 1
    });

    const promptInput = new InputRenderable(this.renderer, {
      id: "prompt-input",
      flexGrow: 1,
      placeholder: "Enter your prompt...",
      margin: 1,
    });

    const promptSend = new TuiButton(this.renderer, {
      label: "Send",
      textColor: { r: 220, g: 220, b: 220 },
      backgroundColor: { r: 50, g: 50, b: 50 },
      height: 1,
      margin: 2,
    });

    promptBar.add(promptInput);
    promptBar.add(promptSend.box);
    box.add(promptBar);
    this.renderer.root.add(box);

    promptInput.focus();

    this.renderer.keyInput.on("keypress", (key) => {
      if (key.name === "q") {
        this.renderer.destroy();
        return;
      }

      if (key.name === "return" && promptInput.focused) {
        promptInput.value = "";
      }
    });
  }
}
