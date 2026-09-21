import { readFileTool } from "../readFile";

const result = await readFileTool.execute({
  path: "README.md",
});

console.log(result);
