import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSessionDescription = async (topic: string, program: string): Promise<{description: string, sources: string[]}> => {
  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Schrijf een wervende en informatieve beschrijving voor een sessie over "${topic}" voor het programma "${program}".
      De doelgroep zijn studenten of werkzoekenden.
      Gebruik actuele informatie indien relevant.
      Schrijf het in het Nederlands.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Kon geen beschrijving genereren.";
    
    // Extract sources if available
    const sources: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }

    return { description: text, sources };
  } catch (error) {
    console.error("Fout bij genereren beschrijving:", error);
    throw error;
  }
};

export const generateSessionImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string> => {
  try {
    const model = 'gemini-3-pro-image-preview';
    
    // The prompt explicitly requests no text in the image usually, but here we just pass the user prompt
    const enhancedPrompt = `Een professionele, moderne cover afbeelding voor een educatieve sessie over: ${prompt}. Geen tekst in de afbeelding.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "16:9"
        }
      }
    });

    let imageUrl = '';
    // Iterate to find image part
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }

    if (!imageUrl) {
        throw new Error("Geen afbeelding gegenereerd.");
    }
    
    return imageUrl;
  } catch (error) {
    console.error("Fout bij genereren afbeelding:", error);
    throw error;
  }
};
