
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

export const generateAIPoseImage = async (state: AppState): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    ULTRA-STRICT ARTISTIC DIRECTIVE: SKELETON-TO-PHOTO CONVERSION
    
    You are an expert cinematic photographer. Your task is to generate a photorealistic image that combines identity, action, and world context.
    
    REFERENCE INPUTS:
    1. SUBJECT IMAGE (IDENTITY): Extract the facial identity, skin, and physical traits from this image. 
       - Transformation Target: ${state.subjectStyle}.
    
    2. POSE SKETCH (INVISIBLE BONE STRUCTURE): 
       - The 'Pose Sketch' is purely STRUCTURAL METADATA for body orientation.
       - !!! ABSOLUTE PROHIBITION !!!: DO NOT paint, draw, or render ANY lines from the sketch. 
       - The blue lines represent a HIDDEN skeletal rig. You must interpret these lines as the natural positioning of the character's limbs, spine, and head.
       - The final result must be a clean, natural human body in this pose, with NO blue glowing artifacts, NO sketch lines, and NO neon overlays.
    
    3. SCENE IMAGE (LIGHTING & BACKGROUND): 
       - Integrate the subject into an environment inspired by this scene.
       - Atmosphere: ${state.atmosphere}.
       - Match the lighting direction from the scene to the subject's skin and clothing.
    
    NEGATIVES (FORCE ELIMINATE):
    - NO blue lines or neon strokes in the final output.
    - NO visible skeleton or mannequin parts.
    - NO drawing/sketch aesthetic; the result must be 100% photographic.
    - NO digital artifacts or glowing wireframes.
    
    FINAL OUTPUT: A single, high-fidelity photographic masterpiece.
  `;

  try {
    const parts: any[] = [{ text: prompt }];

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
          mimeType: "image/jpeg",
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
