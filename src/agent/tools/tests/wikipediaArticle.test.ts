import { WikipediaArticleTool } from "../wikipediaArticle";

const tool = new WikipediaArticleTool();
const result = await tool.execute({ title: "Explosion" });
console.log(result);
