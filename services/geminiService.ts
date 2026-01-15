
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

export const generateAIPoseImage = async (state: AppState): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 核心邏輯：將手繪圖定義為「隱形骨架」，禁止在畫面中出現任何草圖元素
  const prompt = `
    CRITICAL ARTISTIC INSTRUCTION: SKELETON-BASED PHOTO SYNTHESIS
    
    1. SUBJECT IDENTITY (PHOTO REFERENCE): 
       - Extract the exact facial features, identity, and skin texture from the 'Subject Reference' photo.
       - Transformation Style: ${state.subjectStyle}.
    
    2. POSE ARCHITECTURE (HAND-DRAWN SKELETON - MANDATORY INVISIBLE GUIDE): 
       - The 'Pose Sketch' image provided is a STRUCTURAL MAP ONLY.
       - STRICT REQUIREMENT: DO NOT render any part of the actual sketch (no blue lines, no neon strokes, no hand-drawn artifacts).
       - Action Mapping: The human character must mimic the exact limbs, torso orientation, and joint angles shown in the sketch.
       - If the sketch has a stroke representing an arm, the generated human must have a realistic arm in that identical position.
    
    3. WORLD INTEGRATION (SCENE REFERENCE):
       - Environment: Use the 'Scene Reference' for background details and lighting direction.
       - Atmosphere: ${state.atmosphere}.
       - Final lighting must wrap around the subject naturally, making them look like they were physically present in the scene.
    
    NEGATIVE CONSTRAINTS (IMPORTANT):
    - NO blue glowing lines.
    - NO skeletal overlays.
    - NO hand-drawn aesthetic in the final render.
    - Output must be a PURE, photorealistic cinematic image.
  `;

  try {
    const parts: any[] = [{ text: prompt }];

    // 按順序提供參考資料
    if (state.subjectImage) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: state.subjectImage.split(',')[1]
        }
      });
    }

    if (state.pose.drawingImage) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: state.pose.drawingImage.split(',')[1]
        }
      });
    }

    if (state.sceneImage) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: state.sceneImage.split(',')[1]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
