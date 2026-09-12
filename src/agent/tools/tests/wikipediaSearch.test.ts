import { WikipediaSearchTool } from "../wikipediaSearch";

const tool = new WikipediaSearchTool();
const results = await tool.execute({ query: "Bun runtime", limit: 3 });
console.log(results);
