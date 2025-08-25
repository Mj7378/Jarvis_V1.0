# J.A.R.V.I.S. V1.0 - Voice AI Assistant

A sophisticated, voice-activated AI assistant inspired by Iron Man's J.A.R.V.I.S. This web application leverages the power of the Google Gemini API for intelligent conversation and features a futuristic, reactive Heads-Up Display (HUD).

This project is a demonstration of how to build a complex, feature-rich AI application using modern web technologies and the Google Gemini API.

## ✨ Features

*   **🎙️ Voice-First Interaction:** Activate J.A.R.V.I.S. with your voice. It listens, understands, and responds in real-time using the Web Speech API.
*   **🧠 Gemini-Powered Intelligence:** At its core, J.A.R.V.I.S. uses the `gemini-2.5-flash` model for fast, witty, and context-aware conversational abilities.
*   ** futuristic HUD:** A dynamic and visually stunning interface built with React and Tailwind CSS, providing a truly immersive experience.
*   **🚀 Device & Web Control:** Issue commands to:
    *   Open any website or web app (e.g., "Launch YouTube", "Open WhatsApp").
    *   Perform Google or YouTube searches.
    *   Find directions using Google Maps.
    *   Play music on YouTube Music.
*   **👁️ Vision Mode:** Activate the device camera to stream video. Capture an image and ask J.A.R.V.I.S. to analyze and describe what it sees.
*   **💡 Advanced Function Modes:**
    *   **Design Mode:** Describe a visual concept and have J.A.R.V.I.S. generate an image using the `imagen-3.0` model.
    *   **Simulation Mode:** Describe a scenario and watch J.A.R.V.I.S. generate a short video clip using the `veo-2.0` model.
    *   **Cyber Analyst:** Provide a URL and receive a detailed analysis of its content, including a summary, sentiment score, reliability rating, and key entities.
*   **💬 Streaming Responses:** AI responses are streamed token-by-token, making the conversation feel more natural and immediate.
*   **⚙️ System Status Display:** A live dashboard shows simulated CPU, memory, and network activity, enhancing the HUD aesthetic.
*   **🔒 Robust Error Handling:** Gracefully handles API errors, microphone permission issues, and unsupported commands with clear user feedback.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS with custom sci-fi theme
*   **AI Models:** Google Gemini API (`@google/genai`)
    *   `gemini-2.5-flash` for text and chat
    *   `imagen-3.0-generate-002` for image generation
    *   `veo-2.0-generate-001` for video generation
*   **Web APIs:**
    *   Web Speech API (SpeechRecognition for input, SpeechSynthesis for output)
    *   `navigator.mediaDevices` (getUserMedia) for camera and microphone access
*   **Modules:** Loaded directly in the browser via `esm.sh` (no build step needed).

## 🚀 Getting Started

### Prerequisites

1.  A modern web browser that supports the Web Speech API (e.g., Google Chrome).
2.  A valid Google Gemini API key.

### Installation & Running

This project is designed to run directly in the browser without a build step.

1.  **Set up the API Key:**
    The application is hard-coded to look for the API key in an environment variable named `API_KEY`. You must ensure this variable is available in the environment where you serve the application.

2.  **Serve the files:**
    Use any simple static file server to serve the project's root directory.
    ```bash
    # If you have Node.js installed
    npx serve
    ```

3.  **Open in Browser:**
    Navigate to the local server's address (e.g., `http://localhost:3000`).

4.  **Grant Permissions:**
    The application will request permission to use your microphone and camera. You must grant these permissions for full functionality.

## 🤖 How It Works

### The J.A.R.V.I.S. Protocol

The core of the AI's functionality is defined by a detailed **system instruction** provided to the Gemini model (`services/geminiService.ts`). This prompt establishes the J.A.R.V.I.S. personality (witty, confident, efficient) and defines a strict communication protocol.

There are two main interaction modes:

1.  **Device Control Protocol:** When a user's command is interpreted as an action (like opening a URL or searching), the AI is instructed to respond **only with a JSON object**. This structured data is then parsed by the frontend to execute the command. This prevents conversational filler and ensures reliable command execution.

    *Example JSON Response:*
    ```json
    {
      "action": "device_control",
      "command": "open_url",
      "app": "Browser",
      "params": { "url": "https://www.youtube.com" },
      "spoken_response": "Bringing up YouTube."
    }
    ```

2.  **Conversational Interaction:** For any other query, the AI engages in a natural, text-based conversation, adopting the J.A.R.V.I.S. persona.

### Application State

The UI is controlled by a central `AppState` enum (`App.tsx`) which dictates the visual feedback for the user:
*   `IDLE`: Waiting for a command.
*   `LISTENING`: The microphone is active and capturing speech.
*   `THINKING`: A request has been sent to the Gemini API, and the app is awaiting a response.
*   `SPEAKING`: The AI is responding via speech synthesis.
*   `ERROR`: An error has occurred.

### Component Structure

*   `App.tsx`: The main component that manages state, handles user input, and orchestrates communication with the Gemini service.
*   `services/geminiService.ts`: Contains all logic for interacting with the `@google/genai` SDK, including the main system prompt and functions for different AI modes.
*   `components/`: A collection of React components for different parts of the UI.
    *   `CoreInterface.tsx`: The central animated orb for voice activation.
    *   `ChatLog.tsx`: Displays the conversation history.
    *   `RightSidebar.tsx`: Contains buttons for quick actions and system controls.
    *   `*Mode.tsx` (e.g., `DesignMode.tsx`, `CyberAnalystMode.tsx`): Full-screen modal components for the advanced functions.
*   `hooks/`: Reusable logic for speech recognition (`useSpeechRecognition.ts`) and managing chat history (`useChatHistory.ts`).
