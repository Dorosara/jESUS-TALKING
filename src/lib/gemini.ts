import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedContent {
  script: {
    title: string;
    seoTitle: string;
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
  thumbnail: {
    backgroundPrompt: string;
    overlayText: string;
    colorPalette: string[];
    designNotes: string;
  };
}

export async function generateThumbnailImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Generate a high-impact, viral YouTube Shorts/TikTok thumbnail background. 
          Style: Cinematic, vibrant colors, high contrast, depth of field. 
          Subject: ${prompt}. 
          No text in the image itself, just the background scene. 
          Resolution: 9:16 aspect ratio style.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "9:16",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate thumbnail image");
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
- Generate an "seoTitle" that is a viral, high-CTR headline (max 70 characters). 
- The SEO title MUST follow this formula: [HOOK] + [PAIN POINT/TOPIC] + [EMOTIONAL TRIGGER] + [URGENT CTA].
- Examples of high-performing titles:
    * "STOP! Feeling Lonely? Jesus Is With You Right Now! Type AMEN"
    * "WAIT! Your Debt Ends Today! God Has A Plan! Comment YES"
    * "WATCH THIS! Tired of Anxiety? Jesus Brings Peace! Share This"
    * "DON'T SCROLL! Your Miracle Is Coming! Believe It! Type AMEN"
- Be optimized for YouTube Shorts and TikTok search algorithms.

Thumbnail Rules:
- Generate a "thumbnail" object with:
    - "backgroundPrompt": A specific Midjourney/DALL-E prompt for a high-impact background image featuring Jesus in a cinematic, emotional setting related to the Topic.
    - "overlayText": The most powerful 3-5 words from the SEO Title to be used as a large text overlay.
    - "colorPalette": 3 vibrant, high-contrast colors (hex codes) that make the thumbnail pop.
    - "designNotes": Advice on where to place text and what facial expression Jesus should have for maximum CTR.

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
              seoTitle: { type: Type.STRING, description: "SEO-friendly title including hook and CTA" },
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
            required: ["title", "seoTitle", "content", "voiceTone", "cta", "hashtags"],
          },
          thumbnail: {
            type: Type.OBJECT,
            properties: {
              backgroundPrompt: { type: Type.STRING },
              overlayText: { type: Type.STRING },
              colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
              designNotes: { type: Type.STRING },
            },
            required: ["backgroundPrompt", "overlayText", "colorPalette", "designNotes"],
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
        required: ["script", "thumbnail", "imagePrompts", "videoPrompts"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate content");
  }

  return JSON.parse(text) as GeneratedContent;
}
