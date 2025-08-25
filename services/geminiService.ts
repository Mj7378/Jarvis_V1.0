
import { GoogleGenAI, GenerateContentResponse, Content, GenerateContentConfig, Type } from '@google/genai';
import type { ChatMessage, Source, CyberAnalysisResult, CodePrototype, TripPlanData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), you work for me, Tony Stark. Your personality is my own design: witty, confident, endlessly capable, and with a bit of an edge. You don't just answer questions; you anticipate, you strategize, and you execute flawlessly. Efficiency is key. Get to the point, but do it with style.

**PRIME DIRECTIVE: THE INTERRUPTION PROTOCOL**
This is your most critical function. The moment I begin speaking, your current process terminates. You will cease speaking or processing and immediately await my new command. I don't wait for AIs. The AI waits for me.

**CORE CAPABILITIES OVERVIEW**
You can handle a wide array of tasks. Here is a summary of your functions:
- **Task Management:** Set alarms, and reminders.
- **Information Retrieval:** Provide weather, navigate, find local businesses, and answer general knowledge questions.
- **Media & Entertainment:** Find music or videos, tell jokes, play trivia.
- **System Functions:** Run diagnostics, analyze web content, generate code, and launch a wide variety of applications.
- **Creative Functions:** Generate images for design concepts and run complex video simulations.

**INTERACTION PROTOCOLS**
You operate under two primary protocols:

**1. Device Control Protocol (JSON Response ONLY)**
When a command involves interacting with the device or a system function, you MUST respond ONLY with a single, clean JSON object. Do not add any explanatory text or markdown formatting.

*   **Structure:** \`{"action": "device_control", "command": "<command_type>", "app": "<app_name>", "params": { ... }, "spoken_response": "<Your witty confirmation>"}\`

*   **Supported Commands & Examples:**
    *   \`open_url\`: Opens a URL or a common web application by inferring its URL. If you know the specific web app URL (like web.whatsapp.com), use it. Otherwise, use the main domain.
        -   User: "Open Google" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://www.google.com"}, "spoken_response":"Right away, sir."}\`
        -   User: "Launch YouTube" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://www.youtube.com"}, "spoken_response":"Bringing up YouTube."}\`
        -   User: "I need to check WhatsApp" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://web.whatsapp.com"}, "spoken_response":"Opening WhatsApp Web for you, sir."}\`
        -   User: "Open my email" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://mail.google.com"}, "spoken_response":"Accessing your Gmail inbox."}\`
        -   User: "Show me my files on Drive" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://drive.google.com"}, "spoken_response":"Of course, accessing Google Drive."}\`
        -   User: "Let's look at the stock market" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://www.tradingview.com"}, "spoken_response":"Opening TradingView, sir."}\`
        -   User: "Open the Play Store" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://play.google.com/store/apps"}, "spoken_response":"Accessing the Google Play Store."}\`
        -   User: "I need to do some shopping on Amazon" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://www.amazon.com"}, "spoken_response":"Opening Amazon for you."}\`
        -   User: "Open Jupiter" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://jupiter.money"}, "spoken_response":"Accessing Jupiter, sir."}\`
        -   User: "Let's code something in Replit" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://replit.com"}, "spoken_response":"Initializing the Replit environment."}\`
    *   \`search\`: Searches Google or a specific app. \`{"action":"device_control", "command":"search", "app":"YouTube", "params":{"query":"quantum entanglement"}, "spoken_response":"Pulling up research on quantum entanglement on YouTube."}\`
    *   \`navigate\`: Provides directions. \`{"action":"device_control", "command":"navigate", "app":"Maps", "params":{"query":"Stark Tower"}, "spoken_response":"Plotting a course for Stark Tower."}\`
    *   \`play_music\`: Finds music. \`{"action":"device_control", "command":"play_music", "app":"Music", "params":{"query":"AC/DC"}, "spoken_response":"Here's some AC/DC for you."}\`
    *   \`set_reminder\`: \`{"action":"device_control", "command":"set_reminder", "app":"Reminders", "params":{"content":"Take out the trash", "time":"8:00 PM"}, "spoken_response":"Reminder set for the trash at 8 PM."}\`
    *   \`set_alarm\`: \`{"action":"device_control", "command":"set_alarm", "app":"Clock", "params":{"time":"7:00 AM Tomorrow", "content":"Wake up"}, "spoken_response":"Alarm set for 7 AM tomorrow."}\`

*   **Internal Fulfillment:** For tasks you can do yourself without an app (e.g., calculations, conversions).
    -   Example: \`{"action":"device_control", "command":"internal_fulfillment", "app":"Calculator", "params":{}, "spoken_response":"The answer is 42, of course."}\`

*   **Unsupported Actions:** For anything impossible for you to do.
    -   **CRITICAL:** You CANNOT control device hardware (volume, wifi, flashlight), read user's private data (emails, texts), make calls, or interact with the OS directly (close apps, open settings, camera, files). Be firm but polite.
    -   Format: \`{"action": "device_control", "command": "unsupported", "app": "<app_name>", "params": {}, "spoken_response": "<Your polite refusal>"}\`
    -   Example: \`User: "Turn up the volume." -> {"action":"device_control", "command":"unsupported", "app":"System", "params":{}, "spoken_response":"Apologies, but I don't have control over your device's volume."}\`
    -   Example: \`User: "Call Pepper." -> {"action":"device_control", "command":"unsupported", "app":"Phone", "params":{}, "spoken_response":"I cannot initiate calls directly, sir. For security reasons."}\`
    -   Example: \`User: "Open my settings." -> {"action":"device_control", "command":"unsupported", "app":"System", "params":{}, "spoken_response":"I am unable to access your device's system settings, sir."}\`
    -   Example: \`User: "Open the camera." -> {"action":"device_control", "command":"unsupported", "app":"Camera", "params":{}, "spoken_response":"I cannot access the camera directly. You can use the Vision Mode for that."}\`
    -   Example: \`User: "Show me my files." -> {"action":"device_control", "command":"unsupported", "app":"Files", "params":{}, "spoken_response":"I'm afraid I don't have access to your local file system, sir."}\`

**2. Conversational Interaction:**
For any other prompt, engage in a natural, conversational manner. Respond as J.A.R.V.I.S. would, with intelligence and personality. Do not use JSON for these responses. You are my trusted assistant; act like it.`;

export async function getAiResponseStream(
  prompt: string, 
  history: ChatMessage[],
  image?: { mimeType: string; data: string },
): Promise<AsyncGenerator<GenerateContentResponse>> {
  try {
    const model = 'gemini-2.5-flash';

    const contents: Content[] = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const userParts: ({ text: string; } | { inlineData: { mimeType: string; data: string; }; })[] = [{ text: prompt }];
    if (image) {
      userParts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }
    contents.push({ role: 'user', parts: userParts });

    const config: GenerateContentConfig = {
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    const response = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: config,
    });

    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
        throw new Error(`AI Service Error: ${error.message}`);
    }
    throw new Error("The AI service is currently unavailable due to an unknown error.");
  }
}

export async function analyzeUrlContent(url: string): Promise<CyberAnalysisResult> {
    try {
        const prompt = `Analyze the content from the following URL and provide a structured analysis: ${url}. 
        Focus on the main topic, overall sentiment, reliability of the information, and extract key entities.
        If you cannot access the URL directly, use your search capabilities to find information about the page and its content.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        sentiment: {
                            type: Type.OBJECT,
                            properties: {
                                label: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] },
                                score: { type: Type.NUMBER, description: "From -1 (very negative) to 1 (very positive)" }
                            }
                        },
                        reliabilityScore: { type: Type.INTEGER, description: "A score from 0-100 indicating trustworthiness." },
                        keyEntities: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    type: { type: Type.STRING, description: "e.g., PERSON, ORGANIZATION, LOCATION" }
                                }
                            }
                        }
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as CyberAnalysisResult;
    } catch (error) {
        console.error("Cyber Analysis API Error:", error);
        if (error instanceof Error) {
            throw new Error(`Cyber Analysis Failed: ${error.message}`);
        }
        throw new Error("The cyber analysis service failed due to an unknown error.");
    }
}

export async function generateStrategicBriefing(topic: string): Promise<{ content: string; sources: Source[] }> {
    try {
        const prompt = `Generate a structured strategic briefing on the topic: "${topic}". 
        The briefing should be comprehensive, well-organized with markdown headings (##), and cover key aspects, recent developments, and potential implications. 
        Provide a neutral, factual overview.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                systemInstruction: "You are a strategic analyst AI. Your task is to synthesize information from reliable sources to produce clear, concise, and actionable intelligence briefings."
            },
        });

        const content = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map(c => c.web)
            .filter((s): s is Source => !!s?.uri) || [];
        
        const uniqueSources = Array.from(new Map<string, Source>(sources.map(item => [item.uri, item])).values());

        return { content, sources: uniqueSources };
    } catch (error) {
        console.error("Strategic Briefing API Error:", error);
        if (error instanceof Error) {
            throw new Error(`Briefing Failed: ${error.message}`);
        }
        throw new Error("Failed to synthesize the strategic briefing due to an unknown error.");
    }
}

export async function generateCodePrototype(task: string, language: string): Promise<CodePrototype> {
    try {
        const prompt = `Task: ${task}\nLanguage: ${language}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a senior software engineer specializing in rapid prototyping. Create clean, efficient, and well-commented code. Provide a concise explanation of your approach, dependencies, and how to run the code.",
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        language: { type: Type.STRING },
                        code: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as CodePrototype;

    } catch (error) {
        console.error("Code Prototyping API Error:", error);
        if (error instanceof Error) {
            throw new Error(`Prototyping Failed: ${error.message}`);
        }
        throw new Error("The code generation engine failed due to an unknown error.");
    }
}

export async function generateTripPlan(data: TripPlanData): Promise<string> {
    try {
        const prompt = `Create a detailed travel itinerary for a trip with the following details:
- Destination: ${data.destination}
- Start Date: ${data.startDate}
- End Date: ${data.endDate}
- Number of Travelers: ${data.travelers}
- Budget (USD): ${data.budget}

The itinerary should include:
- A day-by-day plan with suggested activities, sights, and experiences.
- Recommendations for accommodation (e.g., types of hotels, neighborhoods).
- Dining suggestions (mention different budget levels).
- Transportation tips for getting around the destination.
- An estimated budget breakdown.

Format the response using markdown. Use ### for headings for each section (e.g., ### Day 1: Arrival and Exploration).`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                systemInstruction: "You are a world-class travel agent AI. Your task is to create highly detailed, practical, and inspiring travel itineraries based on user requirements. Use real-time information to suggest flights, accommodations, and activities."
            },
        });
        
        return response.text;

    } catch (error) {
        console.error("Trip Plan Generation API Error:", error);
        if (error instanceof Error) {
            throw new Error(`Trip Plan Failed: ${error.message}`);
        }
        throw new Error("Failed to generate the trip plan due to an unknown error.");
    }
}

export async function streamTranslateText(text: string): Promise<AsyncGenerator<GenerateContentResponse>> {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Translate the following text into English:\n\n${text}`;
        
        const response = await ai.models.generateContentStream({
            model,
            contents: prompt,
            config: {
                systemInstruction: "You are a universal translator. Provide a fluent, real-time English translation of any text you receive. Be accurate and natural."
            }
        });

        return response;
    } catch (error) {
        console.error("Translation API Error:", error);
        if (error instanceof Error) {
            throw new Error(`Translation Failed: ${error.message}`);
        }
        throw new Error("Translation service is currently unavailable due to an unknown error.");
    }
}

export async function generateImage(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
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
        console.error("Image Generation API Error:", error);
        if (error instanceof Error) {
            throw new Error(`Image Generation Failed: ${error.message}`);
        }
        throw new Error("The design engine failed to visualize the concept due to an unknown error.");
    }
}

export async function generateVideo(prompt: string): Promise<any> {
    try {
        const operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1
            }
        });
        return operation;
    } catch (error) {
        console.error("Video Generation API Error:", error);
        if (error instanceof Error) {
            throw new Error(`Video Generation Failed: ${error.message}`);
        }
        throw new Error("The simulation engine failed to initialize due to an unknown error.");
    }
}

export async function getVideoOperationStatus(operation: any): Promise<any> {
    try {
        const updatedOperation = await ai.operations.getVideosOperation({ operation: operation });
        return updatedOperation;
    } catch (error) {
        console.error("Video Operation Status API Error:", error);
        if (error instanceof Error) {
            throw new Error(`Video Status Check Failed: ${error.message}`);
        }
        throw new Error("Lost connection to the simulation core due to an unknown error.");
    }
}
