import { downloadWikipediaImageTool } from "../wikipediaImage";

const result = await downloadWikipediaImageTool.execute({
  title: "File:Mona_Lisa.jpg",
});

console.log(result);
