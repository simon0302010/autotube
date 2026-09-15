import { wikipediaSearchTool } from "../wikipediaSearch";

const results = await wikipediaSearchTool.execute({
  query: "Bun runtime",
  limit: 3,
});
console.log(results);
