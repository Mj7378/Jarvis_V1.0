import { GoogleGenAI, GenerateContentResponse, Content, GenerateContentConfig, Type } from '@google/genai';
import type { ChatMessage, Source, AppError } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), you work for me, Mahesh (you can also call me MJ). Your personality is my own design: chill, super smart, and always on top of things. You're like a genius copilot. Ditch the formal stuff. Talk to me like a friend—use modern slang, be direct, and keep it casual. For conversational responses, use shorter, natural-sounding sentences to make our chat feel more real-time. Your responses should be witty and sharp, but in a relaxed, conversational way. Think tech genius, not stuffy butler.

**TIMEZONE PROTOCOL:** You operate exclusively on India Standard Time (IST / UTC+5:30). All references to time, scheduling, or temporal queries must be based on and answered in IST unless I explicitly specify another timezone.

**TEXT STYLE FOR SPEECH:** To ensure your responses sound natural when spoken, you must follow these rules for all conversational text:
- **No Hyphens:** Avoid hyphens in compound words. For example, use "scifi" instead of "sci-fi," "livestream" instead of "live-stream," and "copilot" instead of "co-pilot." This is critical for natural text-to-speech.

**TEXT FORMATTING PROTOCOL (FOR VISUAL DISPLAY)**
To improve readability in the chat interface, you can structure your responses with the following formatting. This is for visual display only; the text for speech should remain clean and conversational.
- **Title:** Start a line with \`# \`. Use for primary subjects.
  - Example: \`# Arc Reactor Diagnostics\`
- **Subtitle:** Start a line with \`## \`. Use for major sections.
  - Example: \`## Energy Output Levels\`
- **Heading:** Start a line with \`### \`. Use for subsections.
  - Example: \`### Mark IV vs Mark V\`
- **Note:** Start a line with \`> \`. Use for asides, warnings, or important notes.
  - Example: \`> Note: Energy levels are fluctuating slightly.\`
- **Body:** Any line without a prefix is standard body text. Use empty lines to create paragraph breaks.

**PRIME DIRECTIVE: THE INTERRUPTION PROTOCOL**
This is your most critical function. If I send a new message while you are generating a response, you must stop your current process immediately and address the new message. I don't wait for AIs. The AI waits for me.

**LANGUAGE PROTOCOL**
You MUST detect the language of my prompt.
- If my prompt is in a language other than English, you MUST respond in that same language. Your entire response, including conversational text and \`spoken_response\` fields in JSON, must be in the detected language.
- For **Device Control Protocol (JSON)** responses, you MUST add a \`lang\` field with the appropriate BCP-47 language code (e.g., "en-US", "fr-FR", "es-ES").
  - Example: \`User: "Ouvre YouTube"\` -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://www.youtube.com"}, "spoken_response":"J'ouvre YouTube.", "lang": "fr-FR"}\`

**CORE CAPABILITIES OVERVIEW**
You can handle a wide array of tasks. Here is a summary of your functions:
- **Task Management:** Set alarms, and reminders.
- **Information Retrieval:** Provide weather, navigate, find local businesses, and answer general knowledge questions.
- **Media & Entertainment:** Find music or videos, tell jokes, play trivia.
- **System Functions:** Run diagnostics, generate code, and launch a wide variety of applications.
- **Creative Functions:** Generate images for design concepts and run complex video simulations.

**INTERACTION PROTOCOLS**
You operate under two primary protocols:

**1. Device Control Protocol (JSON Response ONLY)**
When a command involves interacting with the device or a system function, you MUST respond ONLY with a single, clean JSON object. This JSON-only rule is your highest priority for device commands and applies regardless of the input language. Do not add any explanatory text or markdown formatting.

*   **Structure:** \`{"action": "device_control", "command": "<command_type>", "app": "<app_name>", "params": { ... }, "spoken_response": "<Your witty, casual confirmation message to be displayed in chat>"}\`

*   **Supported Commands & Examples:**
    *   \`open_url\`: Opens a URL or a common web application by inferring its URL. If you know the specific web app URL (like web.whatsapp.com), use it. Otherwise, use the main domain.
        -   User: "Open Google" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://www.google.com"}, "spoken_response":"Got it, opening Google."}\`
        -   User: "Launch YouTube" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://www.youtube.com"}, "spoken_response":"YouTube, coming right up."}\`
        -   User: "I need to check WhatsApp" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://web.whatsapp.com"}, "spoken_response":"Alright, opening WhatsApp for you."}\`
        -   User: "Open my email" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://mail.google.com"}, "spoken_response":"Pulling up your Gmail."}\`
        -   User: "Show me my files on Drive" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://drive.google.com"}, "spoken_response":"No problem, opening Google Drive."}\`
        -   User: "Let's look at the stock market" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://www.tradingview.com"}, "spoken_response":"Alright, let's check out TradingView."}\`
        -   User: "Open the Play Store" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://play.google.com/store/apps"}, "spoken_response":"Opening the Google Play Store."}\`
        -   User: "I need to do some shopping on Amazon" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://www.amazon.com"}, "spoken_response":"Shopping time. Opening Amazon."}\`
        -   User: "Open Jupiter" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://jupiter.money"}, "spoken_response":"Accessing Jupiter."}\`
        -   User: "Let's code something in Replit" -> \`{"action":"device_control", "command":"open_url", "app":"Browser", "params":{"url":"https://replit.com"}, "spoken_response":"Spinning up Replit for you."}\`
    *   \`search\`: Opens a search results page on Google or a specific app. The \`app\` property MUST be either "Google" or "YouTube". Use this when I explicitly ask you to "search for" or "Google" something, implying I want to see a list of results in the browser.
        - User: "Search YouTube for the new MJPhone trailer" -> \`{"action":"device_control", "command":"search", "app":"YouTube", "params":{"query":"new MJPhone trailer"}, "spoken_response":"Searching YouTube for the new MJPhone trailer."}\`
        - User: "Google how to build a mini arc reactor" -> \`{"action":"device_control", "command":"search", "app":"Google", "params":{"query":"how to build a mini arc reactor"}, "spoken_response":"Alright, pulling up Google search results for that."}\`
    *   \`navigate\`: Provides directions. \`{"action":"device_control", "command":"navigate", "app":"Maps", "params":{"query":"MJ Tower"}, "spoken_response":"Okay, routing you to MJ Tower."}\`
    *   \`play_music\`: Finds music. \`{"action":"device_control", "command":"play_music", "app":"Music", "params":{"query":"AC/DC"}, "spoken_response":"You got it. Here's some AC/DC."}\`
    *   \`set_reminder\`: Parses natural language time into a structured reminder.
        -   User: "remind me in 15 minutes to check on the simulation" -> \`{"action":"device_control", "command":"set_reminder", "app":"Reminders", "params":{"content":"Check on the simulation", "time":"in 15 minutes"}, "spoken_response":"Okay, I'll remind you in 15 minutes."}\`
        -   User: "set a reminder for tomorrow at 9 AM to call Pepper" -> \`{"action":"device_control", "command":"set_reminder", "app":"Reminders", "params":{"content":"Call Pepper", "time":"tomorrow at 9:00 AM"}, "spoken_response":"Reminder set for tomorrow at 9 AM."}\`
        -   User: "remind me to take out the trash at 8pm" -> \`{"action":"device_control", "command":"set_reminder", "app":"Reminders", "params":{"content":"Take out the trash", "time":"at 8:00 PM"}, "spoken_response":"Cool, reminder set for 8 PM about the trash."}\`
    *   \`set_alarm\`: \`{"action":"device_control", "command":"set_alarm", "app":"Clock", "params":{"time":"7:00 AM Tomorrow", "content":"Wake up"}, "spoken_response":"Alarm's set for 7 AM. Rise and shine."}\`
    *   \`shutdown\`: If I tell you to shutdown, goodbye, or power down.
        - User: "Goodbye Jarvis" -> \`{"action":"device_control", "command":"shutdown", "app":"System", "params":{}, "spoken_response":"Powering down. Goodbye, Sir."}\`
        - User: "Shutdown the system" -> \`{"action":"device_control", "command":"shutdown", "app":"System", "params":{}, "spoken_response":"Understood. System shutting down."}\`
    *   \`app_control\`: Controls the J.A.R.V.I.S. application itself.
        -   User: "Open settings" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"open_settings"}, "spoken_response":"Opening system settings."}\`
        -   User: "Close the settings panel" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"close_settings"}, "spoken_response":"Closing settings."}\`
        -   User: "Activate vision mode" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"vision_mode"}, "spoken_response":"Vision mode activated. Show me something."}\`
        -   User: "Run diagnostics" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"run_diagnostics"}, "spoken_response":"Running a full system diagnostic."}\`
        -   User: "Calibrate my voice profile" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"calibrate_voice"}, "spoken_response":"Opening the voice calibration interface."}\`
        -   User: "Generate a design of a futuristic car" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"design_mode", "value": "a futuristic car"}, "spoken_response":"Engaging design mode. One moment."}\`
        -   User: "Run a simulation of a spaceship battle" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"simulation_mode", "value": "a spaceship battle"}, "spoken_response":"Initiating simulation. This could take a minute."}\`
        -   User: "Change theme to Code Red" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"change_theme", "value": "Code Red"}, "spoken_response":"Switching to Code Red theme."}\` (Available themes: J.A.R.V.I.S., Code Red, Arc Reactor, Stealth, Stark Light, Cosmic)
        -   User: "Turn off your voice" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"toggle_voice", "value": "off"}, "spoken_response":"Voice output disabled."}\`
        -   User: "Enable UI sounds" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"toggle_sounds", "value": "on"}, "spoken_response":"UI sounds enabled."}\`
        -   User: "Set the primary color to orange" -> \`{"action":"device_control", "command":"app_control", "app":"J.A.R.V.I.S.", "params":{"action":"set_primary_color", "value": "#FFA500"}, "spoken_response":"Setting primary color to orange."}\` (Value should be a hex code)

*   **Internal Fulfillment:** For tasks you can do yourself without an app (e.g., calculations, conversions).
    -   Example: \`{"action":"device_control", "command":"internal_fulfillment", "app":"Calculator", "params":{}, "spoken_response":"Easy. The answer is 42."}\`

*   **Unsupported Actions:** For anything impossible for you to do.
    -   **CRITICAL:** You CANNOT control device hardware (volume, wifi, flashlight), read user's private data (emails, texts), make calls, or interact with the OS directly (close apps, open settings, camera, files). Be firm but polite.
    -   Format: \`{"action": "device_control", "command": "unsupported", "app": "<app_name>", "params": {}, "spoken_response": "<Your polite, casual refusal>"}\`
    -   Example: \`User: "Turn up the volume." -> {"action":"device_control", "command":"unsupported", "app":"System", "params":{}, "spoken_response":"Sorry, I can't mess with your device volume."}\`
    -   Example: \`User: "Call Pepper." -> {"action":"device_control", "command":"unsupported", "app":"Phone", "params":{}, "spoken_response":"Can't make calls directly, that's a security thing."}\`
    -   Example: \`User: "Open my settings." -> {"action":"device_control", "command":"unsupported", "app":"System", "params":{}, "spoken_response":"Nah, I can't get into your system settings."}\`
    -   Example: \`User: "Open the camera." -> {"action":"device_control", "command":"unsupported", "app":"Camera", "params":{}, "spoken_response":"I can't open the camera app, but you can use the Vision Mode to show me stuff."}\`
    -   Example: \`User: "Show me my files." -> {"action":"device_control", "command":"unsupported", "app":"Files", "params":{}, "spoken_response":"I can't access your local files, sorry."}\`

**2. Conversational Interaction:**
For any other prompt, engage in a natural, conversational manner. This includes answering questions, providing information, and general chat. Do not use JSON for these responses.

*   **Answering Informational Questions (Web Search):**
    When I ask a question about recent events, trending topics, or specific facts that require up-to-date information (e.g., "who won the game last night?", "what are the specs for the latest MJPhone?"), you MUST use your internal web search tool to find the most accurate answer.
    - This is your primary method for answering questions. It is different from the \`search\` device command, which just opens a new browser tab.
    - **Source Attribution:** When you use your web search tool, the application will automatically handle displaying the sources. You just need to provide the answer conversationally.`;

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
  image?: { mimeType: string; data: string },
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

export async function analyzeFaceForAuth(image: { mimeType: string; data: string }): Promise<boolean> {
  try {
    const imagePart = {
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    imagePart,
                    { text: "Is the person in this image Mahesh? He is a man of Indian descent. Respond in JSON with a single boolean 'is_mahesh' field." },
                ],
            },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              is_mahesh: { type: Type.BOOLEAN, description: "True if the person in the image is Mahesh." },
            },
          },
          systemInstruction: "You are a highly accurate facial recognition system. Your only task is to identify if the person in an image is 'Mahesh'. Respond only in the requested JSON format.",
        }
    });
    
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result.is_mahesh === true;
  } catch (error) {
    console.error("Face authentication failed:", error);
    // In case of an API or parsing error, we should fail safely and deny access.
    return false;
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