
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

export const generateAIPoseImage = async (state: AppState): Promise<string | null> => {
  // Use API key directly from process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const jointInfo = Object.entries(state.pose.bones)
    .filter(([_, rot]) => {
      const r = rot as {x: number; y: number; z: number};
      return r.x !== 0 || r.y !== 0 || r.z !== 0;
    })
    .map(([name, rot]) => {
      const r = rot as {x: number; y: number; z: number};
      return `${name}: (x:${r.x.toFixed(2)}, y:${r.y.toFixed(2)}, z:${r.z.toFixed(2)})`;
    })
    .join(', ');

  const prompt = `
    HIGH-LEVEL CREATIVE DIRECTIVE: PHOTOREALISTIC CHARACTER SYNTHESIS.
    
    1. SUBJECT IDENTITY (ABSOLUTE PRIORITY): 
       The person in the final output MUST be the IDENTICAL INDIVIDUAL from the 'Subject Reference' image. Replicate their facial structure, skin texture, hair details, and physical build with 100% fidelity. Treat this as a high-end photography portrait session.
    
    2. CHARACTER ATTRIBUTES: 
       Style context: ${state.subjectStyle}. Apply these aesthetic choices to the subject's clothing and environment, but do not alter their facial features.
    
    3. VOLUMETRIC POSE FIDELITY: 
       The character's body must perfectly match the 3D POSE and VOLUME of the anatomical block proxy provided. 
       - Mannequin Data: ${jointInfo || "neutral standing pose"}.
       - Camera/Global Rotation: ${state.pose.rotation.y.toFixed(2)} rad.
       - Lens Compression: ${state.pose.perspective}mm field of view.
       The spatial relationship between limbs, torso, and head must be strictly respected.
    
    4. CINEMATIC INTEGRATION:
       - Context: Extract lighting and environment details from 'Scene Reference'.
       - Mood: ${state.atmosphere}.
       - Integration: Use advanced global illumination to cast realistic shadows from the subject into the scene.
    
    OUTPUT SPEC: 8k resolution, cinematic masterpiece, hyper-realistic, professional lighting, award-winning photography quality.
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

    if (state.sceneImage) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: state.sceneImage.split(',')[1]
        }
      });
    }

    // Use 'gemini-2.5-flash-image' for image generation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    // Iterate through all parts to find the image part
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
