import { BoxRenderable, createCliRenderer, InputRenderable } from "@opentui/core";

export async function runTui() {
    const renderer = await createCliRenderer({
        exitOnCtrlC: true,
        backgroundColor: "#1131E9",
    });

    const panel = new BoxRenderable(renderer, {
        width: "100%",
        height: "100%",
        backgroundColor: "#1131E9",
        alignItems: "center",
        justifyContent: "flex-end",
    });

    const promptBar = new BoxRenderable(renderer, {
        width: "100%",
        height: 3,
        backgroundColor: "#142793",
        alignSelf: "flex-end",
        alignItems: "baseline",
        justifyContent: "center",
        margin: 1,
        marginLeft: 1
    });

    const promptInput = new InputRenderable(renderer, {
        id: "prompt-input",
        width: "100%",
        placeholder: "Enter your prompt...",
        marginLeft: 1
    });

    promptBar.add(promptInput);
    panel.add(promptBar);
    renderer.root.add(panel);

    promptInput.focus();

    renderer.keyInput.on("keypress", (key) => {
        if (key.name === "q") {
            renderer.destroy();
            return;
        }
    });
}