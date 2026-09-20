import {
  BoxRenderable,
  CliRenderer,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextRenderable,
} from "@opentui/core";
import { TuiButton } from "./button";
import { UserMessage } from "./messages/userMessage";
import { DEFAULT_USE_24_HOUR_TIME, type ConfigManager } from "../config";
import { AgentMessage } from "./messages/agentMessage";
import { AgentThought } from "./messages/agentThought";
import type {
  PromisedFunctionCall,
  StreamableMessage,
  StreamableReasoning,
} from "../agent/llm";
import { AgentFunctionCall } from "./messages/agentFunctionCall";
import clipboard from "clipboardy";
import { TuiNotification } from "./notification";
import type { ModelInfo } from "../agent/models";

// TODO: Improve this
export enum AgentStatus {
  Idle = "Idle",
  Working = "Working",
  ErrorRetrying = "Retrying after Error",
  Failed = "Failed",
  Compacting = "Compacting conversation",
}

interface TuiOptions {
  onPromptSend?: (prompt: string) => void;
  model?: ModelInfo;
  getTokens?: () => number;
}

export class Tui {
  private renderer!: CliRenderer;
  private promptInput!: InputRenderable; // Needs to be acessible from anywhere in the class.
  private messageArea!: ScrollBoxRenderable;
  private messages: (
    UserMessage | AgentMessage | AgentThought | AgentFunctionCall
  )[];

  private _status: AgentStatus;
  private statusText!: TextRenderable;
  private model?: ModelInfo;

  private configManager: ConfigManager;
  private onPromptSend?: (prompt: string) => void;
  private getTokens?: () => number;

  constructor(configManager: ConfigManager, options: TuiOptions) {
    this.onPromptSend = options.onPromptSend;
    this.configManager = configManager;
    this.messages = [];
    this._status = AgentStatus.Idle;
    this.model = options.model;
    this.getTokens = options.getTokens;
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

    this.statusText = new TextRenderable(this.renderer, {
      content: this.formatStatus(),
      width: "100%",
      height: 1,
      fg: "#7a7a7a",
      marginLeft: 5,
      marginBottom: 1,
    });

    promptBar.add(this.promptInput);
    promptBar.add(promptSend.renderable);
    box.add(this.messageArea);
    box.add(this.statusText);
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

    if (!prompt && prompt === "") return;
    if (prompt == ":q") this.renderer.destroy();

    // TODO: Create a better way to handle commands (or remove this) (note: this does not clear them message box after using)
    if (prompt == ":tokens") {
      if (!this.getTokens) {
        this.displayNotification("No token information available", 3000);
        return;
      }
      this.displayNotification(`${this.getTokens()} tokens used`, 3000);
      return;
    }

    if (
      this.status === AgentStatus.Working ||
      this.status === AgentStatus.ErrorRetrying
    ) {
      this.displayNotification("The agent is still working", 3000);
      return;
    }

    this.promptInput.clearSelection();
    this.promptInput.clear();

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

  async addFunctionCall(call: PromisedFunctionCall, invalid: boolean) {
    const lastMessage = this.messages.at(-1);
    // Pack function calls together
    if (lastMessage instanceof AgentFunctionCall) lastMessage.marginBottom = 0;

    const agentFunctionCall = new AgentFunctionCall(this.renderer, {
      functionName: call.originalCall.name,
      functionArguments: await call.promise,
      callId: call.originalCall.id ?? "Unknown call ID",
      failed: invalid,
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

  set status(value: AgentStatus) {
    this._status = value;
    this.statusText.content = this.formatStatus();
  }

  get status(): AgentStatus {
    return this._status;
  }

  private formatStatus(): string {
    return `${this.status}${this.model ? ` – ${this.model.name ?? this.model.id}` : ""}${this.model && this.model.context_length ? ` – ${this.model.context_length} tokens context` : ""}`;
  }
}
