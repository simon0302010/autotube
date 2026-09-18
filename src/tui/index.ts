import {
  BoxRenderable,
  CliRenderer,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
} from "@opentui/core";
import { TuiButton } from "./button";
import { UserMessage } from "./messages/userMessage";
import { DEFAULT_USE_24_HOUR_TIME, type ConfigManager } from "../config";
import { AgentMessage } from "./messages/agentMessage";
import { AgentThought } from "./messages/agentThought";
import type { StreamableMessage, StreamableReasoning } from "../agent/llm";
import { AgentFunctionCall } from "./messages/agentFunctionCall";
import type { ResponseFunctionToolCall } from "openai/resources/responses/responses.mjs";
import clipboard from "clipboardy";
import { TuiNotification } from "./notification";

interface TuiOptions {
  onPromptSend?: (prompt: string) => void;
}

export class Tui {
  private renderer!: CliRenderer;
  private promptInput!: InputRenderable; // Needs to be acessible from anywhere in the class.
  private messageArea!: ScrollBoxRenderable;
  private messages: (
    UserMessage | AgentMessage | AgentThought | AgentFunctionCall
  )[];

  private configManager: ConfigManager;
  private onPromptSend?: (prompt: string) => void;

  constructor(configManager: ConfigManager, options: TuiOptions) {
    this.onPromptSend = options.onPromptSend;
    this.configManager = configManager;
    this.messages = [];
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
      stickyScroll: true,
      stickyStart: "bottom",
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

    // Copies selected text to the clipboard
    this.renderer.on("selection", async (selection) => {
      if (!selection) return;
      const text = selection.getSelectedText();
      if (text && text != "") await clipboard.write(text);
      this.renderer.clearSelection();
      this.displayNotification("Copied to clipboard", 3000);
    });

    // Focuses the prompt so the user doesn't have to.
    // Consider removing this when adding more inputs.
    this.promptInput.focus();
  }

  // This retrieves the prompt and does all the magic
  private async handleSend() {
    const prompt = this.promptInput.value.trim();
    this.promptInput.clearSelection();
    this.promptInput.clear();

    if (!prompt && prompt === "") return;
    if (prompt == ":q") this.renderer.destroy();

    this.addUserMessage(prompt);

    if (this.onPromptSend) {
      this.onPromptSend(prompt);
    }
  }

  // Adds a user message to the TUI
  private async addUserMessage(content: string) {
    const userMessage = new UserMessage(this.renderer, {
      content,
      use24HourTime:
        this.configManager.config.use24HourTime ?? DEFAULT_USE_24_HOUR_TIME,
    });

    this.messages.push(userMessage);
    this.messageArea.add(userMessage.renderable);
  }

  // Change stream to an iterator
  async addAgentMessage(message: StreamableMessage) {
    const agentMessage = new AgentMessage(this.renderer, {
      stream: true,
    });

    // Keeps track of messages
    this.messages.push(agentMessage);
    // Adds it to the TUI
    this.messageArea.add(agentMessage.renderable);

    // Iterates over the stream adding every chunk
    for await (const chunk of message.stream) agentMessage.addChunk(chunk);
    // Needs to be called after the stream finishes for proper formatting
    agentMessage.finishStream();
  }

  // Change stream to an iterator
  async addAgentThought(thought: StreamableReasoning) {
    const agentThought = new AgentThought(this.renderer, {
      stream: true,
    });

    // Keeps track of messages
    this.messages.push(agentThought);
    // Adds it to the TUI
    this.messageArea.add(agentThought.renderable);

    // Iterates over the stream adding every chunk
    for await (const chunk of thought.stream) agentThought.addChunk(chunk);
    // Needs to be called after the stream finishes for proper formatting
    agentThought.finishStream();
  }

  async addFunctionCall(call: ResponseFunctionToolCall) {
    const lastMessage = this.messages.at(-1);
    // Pack function calls together
    if (lastMessage instanceof AgentFunctionCall) lastMessage.marginBottom = 0;

    const agentFunctionCall = new AgentFunctionCall(this.renderer, {
      functionName: call.name,
      functionArguments: call.arguments,
      callId: call.id ?? "Unknown call ID",
    });

    // Keeps track of messages
    this.messages.push(agentFunctionCall);
    // Adds it to the TUI
    this.messageArea.add(agentFunctionCall.renderable);
  }

  // Displays a notification
  async displayNotification(content: string, duration: number) {
    const notif = new TuiNotification(this.renderer, { content });
    await notif.display(duration);
  }
}
