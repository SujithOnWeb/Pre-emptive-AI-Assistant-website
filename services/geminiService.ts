import { GoogleGenAI, Chat, Type, GenerateContentResponse, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { AIResponse } from '../types';

let ai: GoogleGenAI;

try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI. Make sure API_KEY is set.", error);
}


const responseSchema = {
  type: Type.OBJECT,
  properties: {
    responseText: {
      type: Type.STRING,
      description: "A short, conversational response to the user's query."
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-5 predictive next actions or questions for the user."
    },
    contentType: {
      type: Type.STRING,
      description: "The type of content to display. Can be 'welcome', 'insurance_list', 'insurance_detail', 'faq', 'support', or 'none'."
    },
    contentData: {
      type: Type.OBJECT,
      description: "Data for the content type. Can contain insurance products, FAQs, etc.",
      properties: {
        products: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              monthlyPremium: { type: Type.STRING },
              coverage: { type: Type.STRING },
              category: { type: Type.STRING },
              imageUrl: { type: Type.STRING, description: "A placeholder image URL from picsum.photos with a unique seed for each product." },
            }
          }
        },
        product: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            monthlyPremium: { type: Type.STRING },
            coverage: { type: Type.STRING },
            category: { type: Type.STRING },
            imageUrl: { type: Type.STRING },
          }
        },
        faqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            }
          }
        },
        title: { type: Type.STRING },
        message: { type: Type.STRING }
      }
    }
  },
  required: ['responseText', 'suggestions', 'contentType', 'contentData']
};

export const startChatSession = (): Chat | null => {
  if (!ai) {
    console.error("GoogleGenAI is not initialized.");
    return null;
  }
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema,
    },
  });
};

export const sendMessageToAI = async (chat: Chat, message: string): Promise<AIResponse> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    const jsonText = response.text.trim();
    const parsedResponse: AIResponse = JSON.parse(jsonText);
    return parsedResponse;
  } catch (error) {
    console.error("Error sending message to Gemini or parsing response:", error);
    return {
      responseText: "I'm sorry, but I encountered an error. Please try again.",
      suggestions: ["Start over", "Contact support"],
      contentType: 'support',
      contentData: {
        title: "System Error",
        message: "There was a problem communicating with the AI. Please check your connection and try again."
      }
    };
  }
};


export const generateSpeech = async (text: string): Promise<string> => {
  if (!ai) {
    console.error("GoogleGenAI is not initialized for speech generation.");
    return "";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say it in a friendly and professional tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from TTS API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    return "";
  }
};