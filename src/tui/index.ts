import {
  BoxRenderable,
  CliRenderer,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
} from "@opentui/core";
import { TuiButton } from "./button";

export class Tui {
  private renderer!: CliRenderer;
  private promptInput!: InputRenderable; // Needs to be acessible from anywhere in the class.

  constructor() {}

  async buildAndRun() {
    this.renderer = await createCliRenderer({
      exitOnCtrlC: true,
    });

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

    this.promptInput = new InputRenderable(this.renderer, {
      id: "prompt-input",
      flexGrow: 1,
      placeholder: "Enter your prompt...",
      margin: 1,
    });

    // Activated when the enter key is pressed
    this.promptInput.on(InputRenderableEvents.ENTER, () => {
      this.handleSend().catch(console.error);
    });

    const promptSend = new TuiButton(this.renderer, {
      label: "Send",
      textColor: { r: 220, g: 220, b: 220 },
      backgroundColor: { r: 50, g: 50, b: 50 },
      height: 1,
      margin: 2,
      onClick: async () => this.handleSend().catch(console.error),
    });

    promptBar.add(this.promptInput);
    promptBar.add(promptSend.box);
    box.add(promptBar);
    this.renderer.root.add(box);

    // Focuses the prompt so the user doesn't have to.
    // Consider removing this when adding more inputs.
    this.promptInput.focus();
  }

  // This retrieves the prompt and does all the magic
  private async handleSend() {
    const _prompt = this.promptInput.value;
    this.promptInput.clearSelection();
    this.promptInput.clear();

    // TODO: Send this to an AI model and do the rest
  }

  async addMessage(message: string) {
    // Shows the message in the TUI
    // Not implemented yet
  }
}
