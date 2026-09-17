import { toolRegistry } from "./toolRegistry";
import type { ToolMetadata, ToolResult } from "./tool";
import { ENV_PATHS } from "../..";
import path from "path";
import { mkdir } from "node:fs/promises";

interface ArticleParams {
  title: string;
  summary?: boolean | null;
}

interface ArticleImage {
  title: string;
  url: string;
  width: number;
  height: number;
  localPath: string;
}

interface ArticleResult {
  title: string;
  extract: string;
  images: ArticleImage[];
}

interface SummaryResponse {
  title: string;
  extract: string;
}

interface ImagesResponse {
  query: {
    pages: Record<string, { images?: { title: string }[] }>;
  };
}

interface ImageInfoResponse {
  query: {
    pages: Record<
      string,
      { imageinfo?: { url: string; width: number; height: number }[] }
    >;
  };
}

interface ExtractResponse {
  query: {
    pages: Record<
      string,
      {
        pageid?: number;
        ns?: number;
        title?: string;
        extract?: string;
      }
    >;
  };
}

export const wikipediaArticleTool: ToolMetadata<ArticleParams, ArticleResult> =
  {
    definition: {
      type: "function",
      name: "fetchWikipediaArticle",
      description:
        "Fetch a Wikipedia article's complete text and all image links via page title.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description:
              "Wikipedia page title (e.g. 'Mona_Lisa', 'Albert_Einstein')",
          },
          summary: {
            type: ["boolean", "null"],
            description:
              "Return full article text (False) or return summary (True) (default False)",
          },
        },
        required: ["title", "summary"],
        additionalProperties: false,
      },
      strict: true,
    },

    execute: async (
      payload: ArticleParams,
    ): Promise<ToolResult<ArticleResult>> => {
      const { title } = payload;
      const summary = payload.summary ?? false;

      let extract: string;

      if (summary) {
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const summaryResponse = await fetch(summaryUrl, {
          headers: {
            "User-Agent": "Autotube/1.1 (utkrishth@utkrishth.in)",
          },
        });

        if (!summaryResponse.ok) {
          return {
            success: false,
            error: `Wikipedia API error: ${summaryResponse.status} ${summaryResponse.statusText}`,
          };
        }

        const summaryData = (await summaryResponse.json()) as SummaryResponse;
        extract = summaryData.extract;
      } else {
        const extractParams = new URLSearchParams({
          action: "query",
          titles: title,
          prop: "extracts",
          explaintext: "true",
          format: "json",
          origin: "*",
        });
        const extractUrl = `https://en.wikipedia.org/w/api.php?${extractParams}`;
        const extractResponse = await fetch(extractUrl, {
          headers: {
            "User-Agent": "Autotube/1.1 (utkrishth@utkrishth.in)",
          },
        });

        if (!extractResponse.ok) {
          return {
            success: false,
            error: `Wikipedia extract article API error: ${extractResponse.status} ${extractResponse.statusText}`,
          };
        }

        const extractData = (await extractResponse.json()) as ExtractResponse;

        const pages = Object.values(extractData.query.pages);
        extract = pages[0]?.extract ?? "";
      }

      const imageParams = new URLSearchParams({
        action: "query",
        titles: title,
        prop: "images",
        format: "json",
        origin: "*",
      });
      const imageUrl = `https://en.wikipedia.org/w/api.php?${imageParams}`;

      const imageResponse = await fetch(imageUrl);
      const imageData = (await imageResponse.json()) as ImagesResponse;

      const images: ArticleImage[] = [];
      await mkdir(ENV_PATHS.temp, { recursive: true });

      if (imageData.query) {
        const pages = Object.values(imageData.query.pages);
        // What the fuck, TypeScript?
        const pageImages = pages[0]?.images?.slice(0, 20) ?? [];

        for (const image of pageImages) {
          const infoParams = new URLSearchParams({
            action: "query",
            titles: image.title,
            prop: "imageinfo",
            iiprop: "url|size",
            format: "json",
            origin: "*",
          });
          const infoUrl = `https://en.wikipedia.org/w/api.php?${infoParams}`;

          const infoResponse = await fetch(infoUrl, {
            headers: {
              "User-Agent": "Autotube/1.1 (utkrishth@utkrishth.in)",
            },
          });

          if (!infoResponse.ok) {
            return {
              success: false,
              error: `Wikipedia Info API error: ${infoResponse.status} ${infoResponse.statusText}`,
            };
          }

          const infoData = (await infoResponse.json()) as ImageInfoResponse;

          const infoPages = Object.values(infoData.query.pages);
          const info = infoPages[0]?.imageinfo?.[0];

          if (info) {
            const extension =
              path.extname(new URL(info.url).pathname) || ".png";
            const sanitizedName = image.title
              .replace(/^File:/i, "")
              .replace(/[^\w.-]/g, "_")
              .replace(/_+/g, "_");

            const filename = `${sanitizedName}_${Date.now()}${extension}`;
            const localPath = path.join(ENV_PATHS.temp, filename);

            try {
              const imgReponse = await fetch(info.url, {
                headers: {
                  "User-Agent": "Autotube/1.1 (utkrishth@utkrishth.in)",
                },
              });

              if (imgReponse.ok) {
                const blob = await imgReponse.blob();
                await Bun.write(localPath, blob);
              } else {
                return {
                  success: false,
                  error: `Wikipedia Image API error: ${imgReponse.status} ${imgReponse.statusText}`,
                };
              }
            } catch {
              images.push({
                title: image.title,
                url: info.url,
                width: info.width,
                height: info.height,
                localPath: "",
              });
              continue;
            }

            images.push({
              title: image.title,
              url: info.url,
              width: info.width,
              height: info.height,
              localPath,
            });
          }
        }
      }

      return {
        success: true,
        data: {
          title,
          extract,
          images,
        },
      };
    },
  };

toolRegistry.register("fetchWikipediaArticle", wikipediaArticleTool);
