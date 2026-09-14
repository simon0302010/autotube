import {
  BoxRenderable,
  CliRenderer,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
} from "@opentui/core";
import { TuiButton } from "./button";
import { UserMessage } from "./userMessage";

export class Tui {
  private renderer!: CliRenderer;
  private promptInput!: InputRenderable; // Needs to be acessible from anywhere in the class.
  private messageArea!: ScrollBoxRenderable;
  private userMessages: UserMessage[];

  constructor() {
    this.userMessages = [];
  }

  async buildAndRun() {
    this.renderer = await createCliRenderer({
      exitOnCtrlC: true,
    });

    const box = new BoxRenderable(this.renderer, {
      width: "100%",
      height: "100%",
      backgroundColor: "#252525",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: 1,
    });

    this.messageArea = new ScrollBoxRenderable(this.renderer, {
      width: "100%",
      height: "100%",
      marginBottom: 1,
    });

    const promptBar = new BoxRenderable(this.renderer, {
      width: "100%",
      height: 3,
      backgroundColor: "#1c1c1c",
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-start",
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
    promptBar.add(promptSend.renderable);
    box.add(this.messageArea);
    box.add(promptBar);
    this.renderer.root.add(box);

    // Focuses the prompt so the user doesn't have to.
    // Consider removing this when adding more inputs.
    this.promptInput.focus();
  }

  // This retrieves the prompt and does all the magic
  private async handleSend() {
    const prompt = this.promptInput.value.trim();
    this.promptInput.clearSelection();
    this.promptInput.clear();

    if (prompt == ":q") {
      this.renderer.destroy();
    }

    this.addUserMessage(prompt);

    // TODO: Send this to an AI model and do the rest
  }

  private async addUserMessage(content: string) {
    const userMessage = new UserMessage(this.renderer, {
      content,
    });

    this.userMessages.push(userMessage);
    this.messageArea.add(userMessage.renderable);
  }

  async addAgentMessage(_message: string) {
    // Shows the message in the TUI
    // Not implemented yet
  }
}
