import { GoogleGenAI, GenerateContentResponse, Content, GenerateContentConfig, Type, Modality } from '@google/genai';
import type { ChatMessage, Source, AppError, WeatherData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const handleGeminiError = (error: unknown, context: string): Error => {
    console.error(`Gemini API Error in ${context}:`, error);

    let errorPayload: AppError;

    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            errorPayload = {
                code: 'API_KEY_INVALID',
                title: 'API Key Invalid',
                message: "The configured API key is not valid. This is a configuration issue.",
                details: error.message,
                action: "The application administrator must verify the `API_KEY` environment variable.",
            };
        } else if (error.message.toLowerCase().includes('quota')) {
            errorPayload = {
                code: 'QUOTA_EXCEEDED',
                title: 'Quota Exceeded',
                message: "The request could not be completed because the API quota has been exceeded.",
                details: error.message,
                action: "Please wait and try again later, or check your Google AI Platform billing.",
            };
        } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('fetch failed')) {
            errorPayload = {
                code: 'NETWORK_ERROR',
                title: 'Network Error',
                message: "A network error occurred while trying to communicate with the AI service.",
                details: error.message,
                action: "Please check your internet connection and try again.",
            };
        } else {
            errorPayload = {
                code: 'AI_SERVICE_ERROR',
                title: `AI Service Error`,
                message: `An unexpected error occurred within the AI service during the ${context} operation.`,
                details: error.message,
                action: "If the problem persists, please contact support or check the service status.",
            };
        }
    } else {
        errorPayload = {
            code: 'UNKNOWN_ERROR',
            title: 'Unknown Error',
            message: `An unknown error occurred during the ${context} operation.`,
            details: String(error),
            action: "Please try again. If the issue continues, it may be a bug."
        };
    }
    
    const customError = new Error(errorPayload.message);
    (customError as any).appError = errorPayload;
    return customError;
};

export async function getAiResponseStream(
  prompt: string, 
  history: ChatMessage[],
  model: string,
  systemInstruction: string,
  images?: { mimeType: string; data: string }[],
): Promise<AsyncGenerator<GenerateContentResponse>> {
  try {
    const contents: Content[] = history.map(msg => {
      const parts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [{ text: msg.content }];
      if (msg.imageUrl) {
        // The app uses jpeg data URLs from camera capture and image generation.
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: msg.imageUrl.split(',')[1],
          },
        });
      }
      return {
        role: msg.role,
        parts,
      };
    });

    const userParts: ({ text: string; } | { inlineData: { mimeType: string; data: string; }; })[] = [{ text: prompt }];
    if (images && images.length > 0) {
      for (const image of images) {
          userParts.push({
            inlineData: {
              mimeType: image.mimeType,
              data: image.data,
            },
          });
      }
    }
    contents.push({ role: 'user', parts: userParts });

    const config: GenerateContentConfig = {
      systemInstruction: systemInstruction,
      tools: [{googleSearch: {}}],
    };

    const response = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: config,
    });

    return response;
  } catch (error) {
    throw handleGeminiError(error, "AI Response Stream");
  }
}

export async function getQuickDescription(imageBase64: string): Promise<string> {
  try {
    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [imagePart, { text: 'Describe this scene in one short sentence. Be concise and direct.' }] }],
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      }
    });
    return response.text;
  } catch (error) {
    console.error("Quick description failed:", error);
    return "Analysis temporarily unavailable.";
  }
}

export async function getWolframSimulatedResponse(query: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                role: 'user',
                parts: [{ text: query }]
            }],
            config: {
                systemInstruction: `You are a computational knowledge engine like Wolfram Alpha. Provide a direct, factual answer to the user's query. Use markdown for formatting, especially for mathematical formulas, tables, and lists. Do not add any conversational text, pleasantries, or introductions. Just provide the data.`,
            },
        });
        return response.text;
    } catch (error) {
        throw handleGeminiError(error, "Wolfram Alpha Simulation");
    }
}

export async function getWeatherInfo(latitude: number, longitude: number): Promise<WeatherData> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the location latitude ${latitude} and longitude ${longitude}, provide the current weather information. I need the current temperature in Celsius, a brief weather condition description (e.g., "Cloudy", "Sunny", "Rain", "Snow"), the high and low temperatures for the day in Celsius, the chance of precipitation as a percentage, the city name, and the current day of the week.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        temperature: { type: Type.NUMBER, description: "Current temperature in Celsius." },
                        condition: { type: Type.STRING, description: "Brief weather condition, e.g., Cloudy, Sunny, Rain." },
                        high: { type: Type.NUMBER, description: "Highest temperature for the day in Celsius." },
                        low: { type: Type.NUMBER, description: "Lowest temperature for the day in Celsius." },
                        precipitation: { type: Type.NUMBER, description: "Chance of precipitation as a whole number percentage." },
                        city: { type: Type.STRING, description: "The name of the city." },
                        day: { type: Type.STRING, description: "The current day of the week." },
                    },
                    required: ["temperature", "condition", "high", "low", "precipitation", "city", "day"],
                },
            },
        });
        
        const jsonStr = response.text.trim();
        const weatherData = JSON.parse(jsonStr);
        return weatherData;

    } catch (error) {
        throw handleGeminiError(error, "Weather Information");
    }
}

export async function streamTranslateText(text: string): Promise<AsyncGenerator<GenerateContentResponse>> {
  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: `You are a universal translator. Translate the following text into English. Provide only the translated text, without any additional explanations or context. Text to translate: "${text}"` }]
      }],
      config: {
        systemInstruction: "You are an advanced AI assistant that specializes in real-time translation.",
      },
    });
    return response;
  } catch (error) {
    throw handleGeminiError(error, "Stream Translation");
  }
}

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
    try {
        const audioPart = {
            inlineData: {
                mimeType,
                data: base64Data,
            },
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        audioPart,
                        { text: 'Please transcribe the audio recording. Provide only the text from the audio.' },
                    ],
                },
            ],
            config: {
                systemInstruction: "You are an advanced AI assistant that specializes in transcribing audio to text with high accuracy.",
            }
        });

        return response.text;
    } catch (error) {
        throw handleGeminiError(error, "Audio Transcription");
    }
}

export async function generateImage(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        throw handleGeminiError(error, "Image Generation");
    }
}

export async function editImage(prompt: string, imageBase64: string): Promise<string> {
    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg', // The app always generates/uses jpeg
                data: imageBase64,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // Find the image part in the response
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        throw new Error("AI did not return an image. It may have refused the request.");

    } catch (error) {
        // Check if the error is from the API about safety settings
        if (error instanceof Error && (error.message.includes('safety policy') || error.message.includes('blocked'))) {
             const customError = new Error("The edit could not be completed due to safety restrictions.");
            (customError as any).appError = {
                code: 'SAFETY_POLICY_VIOLATION',
                title: 'Request Blocked',
                message: "The requested image edit was blocked by the safety policy. Please try a different prompt.",
                details: error.message,
            };
            throw customError;
        }
        throw handleGeminiError(error, "Image Editing");
    }
}

export async function generateVideo(prompt: string, imageBase64?: string): Promise<any> {
    try {
        const requestPayload: any = {
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1
            }
        };

        if (imageBase64) {
            requestPayload.image = {
                imageBytes: imageBase64,
                mimeType: 'image/jpeg', // The app always generates/uses jpeg
            };
        }

        const operation = await ai.models.generateVideos(requestPayload);
        return operation;
    } catch (error) {
        throw handleGeminiError(error, "Video Generation");
    }
}

export async function getVideoOperationStatus(operation: any): Promise<any> {
    try {
        const updatedOperation = await ai.operations.getVideosOperation({ operation: operation });
        return updatedOperation;
    } catch (error) {
        throw handleGeminiError(error, "Video Operation Status");
    }
}
