/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = ai.getGenerativeModel({
  model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash",
});

let chat: ReturnType<typeof model.startChat> | null = null;

export const startNewChat = () => {
  chat = model.startChat({
    generationConfig: { maxOutputTokens: 8192, temperature: 0.9 },
  });
};

export interface ImageData {
  base64: string;
  mimeType: string;
}

const runChat = async (prompt: string, imageData?: ImageData): Promise<string> => {
  if (!chat) startNewChat();
  if (imageData) {
    const parts: any[] = [
      { text: prompt || "Describe this image." },
      { inlineData: { data: imageData.base64, mimeType: imageData.mimeType } },
    ];
    const result = await chat!.sendMessage(parts);
    return result.response.text();
  }
  const result = await chat!.sendMessage(prompt);
  return result.response.text();
};

export default runChat;
