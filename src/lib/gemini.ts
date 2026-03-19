import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedContent {
  script: {
    title: string;
    content: { timestamp: string; text: string }[];
    voiceTone: string;
    cta: string;
    hashtags: string;
  };
  imagePrompts: {
    scene: number;
    setting: string;
    emotion: string;
    cameraAngle: string;
    lighting: string;
  }[];
  videoPrompts: {
    scene: number;
    action: string;
    cameraMovement: string;
    dialogue: string;
    emotion: string;
    lightingTransition: string;
  }[];
}

export async function generateVideoContent(
  day: number,
  videoType: string,
  topic: string,
  hook: string
): Promise<GeneratedContent> {
  const prompt = `
Act as a viral YouTube Shorts creator, cinematic AI image prompt engineer, and cinematic video director.
Create a complete content package for a 60-second "AI Talking Jesus" video.

Inputs:
Day: ${day}
Video Type: ${videoType}
Topic: ${topic}
Hook Style: ${hook}

Structure for Script:
1. Hook (max 4 sec) – powerful interruption. Use the Hook Style provided.
2. Relatable struggle - focus on the Topic.
3. Jesus speaks directly (first person, emotional, authoritative).
4. Promise of transformation.
5. CTA (short + engaging).

Rules for Script:
- Use simple English.
- Use emotional pauses (...).
- Make it feel human, not robotic.
- Highly relatable to real-life struggles.
- Total length should be around 60 seconds when spoken slowly.

Image Prompts Rules:
- Break the script into 4–6 scenes.
- Generate ultra-realistic image prompts of Jesus.
- Style: Hyper-realistic, White robe, soft glowing aura, Golden cinematic lighting, Emotional facial expressions, 4K, depth of field.

Video Prompts Rules:
- Convert each scene into a realistic video prompt for Veo 3.
- Character: Jesus.
- Requirements: Perfect lip sync with dialogue, Natural human facial movement, Cinematic camera motion, Emotional pacing.
- Style: Ultra-realistic, Smooth transitions, Soft spiritual background music.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          script: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ["timestamp", "text"],
                },
              },
              voiceTone: { type: Type.STRING },
              cta: { type: Type.STRING },
              hashtags: { type: Type.STRING },
            },
            required: ["title", "content", "voiceTone", "cta", "hashtags"],
          },
          imagePrompts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene: { type: Type.INTEGER },
                setting: { type: Type.STRING },
                emotion: { type: Type.STRING },
                cameraAngle: { type: Type.STRING },
                lighting: { type: Type.STRING },
              },
              required: ["scene", "setting", "emotion", "cameraAngle", "lighting"],
            },
          },
          videoPrompts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene: { type: Type.INTEGER },
                action: { type: Type.STRING },
                cameraMovement: { type: Type.STRING },
                dialogue: { type: Type.STRING },
                emotion: { type: Type.STRING },
                lightingTransition: { type: Type.STRING },
              },
              required: ["scene", "action", "cameraMovement", "dialogue", "emotion", "lightingTransition"],
            },
          },
        },
        required: ["script", "imagePrompts", "videoPrompts"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate content");
  }

  return JSON.parse(text) as GeneratedContent;
}
