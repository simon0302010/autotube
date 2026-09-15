import { wikipediaArticleTool } from "../wikipediaArticle";

const result = await wikipediaArticleTool.execute({
  title: "Explosion",
  summary: true,
});
console.log(result);
