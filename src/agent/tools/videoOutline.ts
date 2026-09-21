import { toolRegistry } from "./toolRegistry";
import type { ToolMetadata, ToolResult } from "./tool";

interface VideoOutlineParams {
  topic: string;
  duration?: number;
  style?: "educational" | "entertaining" | "documentary" | "tutorial";
  sections?: string[];
}

interface OutlineSection {
  title: string;
  duration: string;
  keyPoints: string[];
  scriptNotes?: string;
  visualNotes?: string;
  transition?: string;
}

interface VideoOutlineResult {
  title: string;
  totalDuration: string;
  sections: OutlineSection[];
  metadata: {
    style: string;
    estimatedWords: number;
    sectionsCount: number;
    difficulty: string;
  };
}

export const videoOutlineTool: ToolMetadata<
  VideoOutlineParams,
  VideoOutlineResult
> = {
  definition: {
    type: "function",
    name: "createVideoOutline",
    description: "Create a structured video outline with sections and timing",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The main topic of the video",
        },
        duration: {
          type: ["number", "null"],
          description: "Target video duration in minutes (default 10)",
        },
      },
      required: ["topic"],
      additionalProperties: false,
    },
    strict: true,
  },
  execute: async (
    payload: VideoOutlineParams,
  ): Promise<ToolResult<VideoOutlineResult>> => {
    const {
      topic,
      duration = 10,
      style = "educational",
      sections: customSections,
    } = payload;

    if (!topic || topic.trim().length === 0) {
      return {
        success: false,
        error: "Topic cannot be empty",
      };
    }

    const sections = generateSections(topic, duration, style, customSections);

    return {
      success: true,
      data: {
        title: topic,
        totalDuration: `${duration} minutes`,
        sections,
        metadata: {
          style,
          estimatedWords: duration * 150,
          sectionsCount: sections.length,
          difficulty:
            duration <= 5 ? "easy" : duration <= 15 ? "medium" : "hard",
        },
      },
    };
  },
};

function generateSections(
  topic: string,
  duration: number,
  style: string = "educational",
  customSections?: string[],
): OutlineSection[] {
  const introTime = Math.round(duration * 0.1);
  const outroTime = Math.round(duration * 0.1);
  const mainTime = duration - introTime - outroTime;

  const mainTopics =
    customSections && customSections.length > 0
      ? customSections
      : generateMainTopics(
          topic,
          Math.max(2, Math.min(5, Math.round(duration / 2))),
          style,
        );
  const mainSections = mainTopics.length;
  const sectionTime = Math.round(mainTime / mainSections);

  const sections: OutlineSection[] = [
    {
      title: "Introduction",
      duration: `${introTime} minutes`,
      keyPoints: [
        "Hook the audience",
        `Introduce ${topic}`,
        "What will viewers learn",
      ],
      scriptNotes: generateScriptNotes("Introduction", topic, style),
      visualNotes: generateVisualNotes("Introduction", style),
      transition: "Move to the first main topic",
    },
  ];

  for (let i = 0; i < mainTopics.length; i++) {
    const mainTopic = mainTopics[i]!;
    sections.push({
      title: mainTopic,
      duration: `${sectionTime} minutes`,
      keyPoints: generateKeyPoints(mainTopic),
      scriptNotes: generateScriptNotes(mainTopic, topic, style),
      visualNotes: generateVisualNotes(mainTopic, style),
      transition:
        i === mainTopic.length - 1
          ? "Transition to Conclusion"
          : `Transition to ${mainTopics[i + 1]}`,
    });
  }

  sections.push({
    title: "Conclusion",
    duration: `${outroTime} minutes`,
    keyPoints: ["Summary of key points", "Call to action", "What's next"],
    scriptNotes: generateScriptNotes("Conclusion", topic, style),
    visualNotes: generateVisualNotes("Conclusion", style),
    transition: "End video",
  });

  return sections;
}

function generateMainTopics(
  topic: string,
  count: number,
  style: string,
): string[] {
  const templates = [
    `Background of ${topic}`,
    `Key Concepts of ${topic}`,
    `How ${topic} works`,
    `Benefits of ${topic}`,
    `Challenges with ${topic}`,
    `Real-World Examples`,
    `Future of ${topic}`,
  ];

  return templates.slice(0, count);
}

function generateKeyPoints(sectionTitle: string): string[] {
  const points: Record<string, string[]> = {
    Introduction: [
      "Hook the audience",
      "Introduce the topic",
      "What will viewers learn",
    ],
    Conclusion: ["Summary of key points", "Call to action", "What's next"],
  };

  if (points[sectionTitle]) {
    return points[sectionTitle];
  }

  return [
    `Explain ${sectionTitle.toLowerCase()}`,
    "Provide examples",
    "Key takeaways",
  ];
}

function generateScriptNotes(
  sectionTitle: string,
  topic: string,
  style: string,
): string {
  const notes: Record<string, Record<string, string>> = {
    educational: {
      Introduction: `Start with a compelling fact about ${topic}, ask a thought provoking question to engage viewers`,
      Conclusion: `Summarize the key learning points, encourage viewers to apply what they've learnt.`,
    },
    entertaining: {
      Introduction: `Start with an exciting hook about ${topic}. Use humor or surprising facts.`,
      Conclusion: `End with a memorable takeaway, make viewers want to share the video.`,
    },
    documentary: {
      Introduction: `Set the scene with historical confidence, Introduce the significance of ${topic}`,
      Conclusion: `Reflect on the importance of ${topic}, leave viewers with something to think about`,
    },
    tutorial: {
      Introduction: `Explain what viewers will be able to do after watching, listing required prerequisites.`,
      Conclusion: `Recap the steps learned, suggest next steps for practice`,
    },
  };

  if (notes[style] && notes[style][sectionTitle]) {
    return notes[style][sectionTitle];
  }

  return `Cover the key aspects of ${sectionTitle.toLowerCase()} related ${topic}, use clear examples and explainations`;
}

function generateVisualNotes(sectionTitle: string, style: string): string {
  const visuals: Record<string, Record<string, string>> = {
    educational: {
      Introduction: "Use text overlays, graphics, and engaging thumbnails",
      Conclusion: "Show summary graphics, key points on screen",
    },
    entertaining: {
      Introduction: "Use dynamic visuals, fast cuts, engaging animations",
      Conclusion: "Use memorable imagery, call-to-action graphics",
    },
    documentary: {
      Introduction: "Use archival footage, maps, timeline graphics",
      Conclusion: "Use reflective imagery, emotional visuals",
    },
    tutorial: {
      Introduction: "Show end result, list tools needed",
      Conclusion: "Show completed project, recap steps visually",
    },
  };

  if (visuals[style] && visuals[style][sectionTitle]) {
    return visuals[style][sectionTitle];
  }

  return "Use relevant images, charts and visual aids to support the content";
}

toolRegistry.register("createVideoOutline", videoOutlineTool);
