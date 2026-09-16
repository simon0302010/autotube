#!/usr/bin/env bun

import { ConfigManager } from "./config";
import { LLMSession } from "./agent/llm";
import { Tui } from "./tui";
import { TOML } from "bun";
import envPaths, { type Paths } from "env-paths";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { program } from "commander";

export const ENV_PATHS: Paths = envPaths("autotube", { suffix: "" });

async function main() {
  program
    .option("--config <path>", "path to a custom config file")
    .option("--headless", "runs autotui in headless mode")
    .option("--setup", "triggers the initial configuation wizard");

  program.parse();
  const args = program.opts();

  const configPath: string =
    args.config ?? path.join(ENV_PATHS.config, "config.toml");
  const headless: boolean = args.headless;

  // TODO: Add CL argument for configs and to specify a certain config file path
  let config = {};
  if (!args.setup) {
    try {
      const file = Bun.file(configPath);
      config = TOML.parse(await file.text());
    } catch (e) {
      if (e instanceof Error && "code" in e && e.code !== "ENOENT") {
        throw e; // This is unexpected...
      }
    }
  }
  const configManager = new ConfigManager(config, headless);

  // In a headed environment, this will prompt the user for missing config info
  await configManager.validate();

  // Asks the user whether to save the config if the config has been changed
  if (!headless && !isDeepStrictEqual(config, configManager.config))
    await configManager.askSaveConfig(configPath);

  const apiSetup = await configManager.getApiSetup();
  if (!apiSetup) throw new Error("API setup failed");

  const session = new LLMSession(apiSetup);

  const tui = new Tui(configManager, {
    onPromptSend: async (prompt: string) => {
      session.addMessage({
        role: "user",
        content: prompt,
      });

      const output = await session.call();

      // TODO: Allow different formats for output (within `addAgentMessage`)
      for (const item of output) {
        if (item.type === "message") {
          tui.addAgentMessage(
            item.content[0]?.type === "output_text"
              ? item.content[0].text
              : "Refusal",
          ); // TODO: expand upon "Refusal"
        } else if (item.type === "function_call") {
          tui.addAgentMessage(`(called \`${item.name}\`)`);
        } else if (item.type === "reasoning") {
          tui.addAgentMessage(
            `(thinking \`${item.content?.[0]?.text || "about nothing"}\`)`,
          );
        }
      }
    },
  });

  tui.buildAndRun();
}

await main();
