# J.A.R.V.I.S. V1.0 - AI Assistant

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS Badge"/>
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Google Gemini Badge"/>
</div>
<br>

A sophisticated, voice and text-enabled AI assistant inspired by Iron Man's J.A.R.V.I.S. This web application leverages the full power of the Google Gemini API for intelligent, real-time conversation and features a deeply customizable, futuristic Heads-Up Display (HUD).

This project is a showcase of how to build a complex, feature-rich AI application using modern web technologies, advanced Gemini models, and a focus on immersive user experience.

---

## ✨ Features

### 🧠 Conversational AI Core
*   **Gemini-Powered Intelligence:** At its core, J.A.R.V.I.S. uses the `gemini-2.5-flash` model for fast, witty, and context-aware conversational abilities.
*   **Rich Persona:** A detailed system prompt establishes the iconic J.A.R.V.I.S. personality: confident, efficient, and casually brilliant.
*   **Streaming Responses:** AI responses are streamed token-by-token for natural, real-time conversation flow.
*   **Google Search Grounding:** J.A.R.V.I.S. can answer questions about recent events and trending topics by leveraging Google Search, ensuring up-to-date information.

### 🎙️ Voice & Audio Interaction
*   **Voice Commands:** Full speech-to-text integration allows you to speak commands naturally.
*   **Voice Output:** J.A.R.V.I.S. responds with a synthesized voice, enhancing the assistant experience.
*   **Voice Calibration:** A unique calibration module analyzes your speaking pace and clarity to adjust the AI's response speed, creating a more synchronized conversation.
*   **Immersive UI Sounds:** Procedurally generated sound effects provide satisfying auditory feedback for all interactions.

### 🚀 Advanced Generative Modes
*   **👁️ Vision Mode:** Activate your camera to stream video. Capture an image and ask J.A.R.V.I.S. to analyze and describe what it sees.
*   **🎨 Image Studio (Design Mode):** Describe an initial concept and have J.A.R.V.I.S. generate an image. Then, use conversational commands to interactively edit the image—add objects, change colors, alter the background, and more, leveraging the `gemini-2.5-flash-image-preview` model.
*   **🎬 Simulation Mode:** Describe a scenario (e.g., "a high-speed chase through a neon city") and watch J.A.R.V.I.S. generate a short video clip using the `veo-2.0-generate-001` model.

### 📎 Versatile Input Methods
J.A.R.V.I.S. accepts more than just text and voice commands. Use the attachment menu to:
*   **Upload Media:** Analyze images from your gallery.
*   **Analyze Documents:** Upload text files for summarization or analysis.
*   **Transcribe Audio:** Provide an audio file for J.A.R.V.I.S. to transcribe.
*   **Use Your Location:** Share your current location to get information about your surroundings and discover local spots.

### ⚙️ System & Device Control
*   **Reliable Command Protocol:** J.A.R.V.I.S. uses a strict JSON-only protocol for device commands, ensuring high reliability.
*   **Web App Integration:** Issue commands to open a wide range of built-in websites and web apps, including YouTube, Gmail, Google Drive, GitHub, TradingView, WhatsApp, Replit, and Wikipedia.
*   **Custom App Launcher:** Add your own favorite web apps to the launcher for quick, voice-activated access.
*   **Integrated Search:** Directly ask J.A.R.V.I.S. to search Google or YouTube for specific queries.
*   **System Functions:** Run simulated diagnostics or issue a shutdown command for a complete system lifecycle experience.
*   **🏠 Home Automation Integration:** Connect directly to your Home Assistant instance via WebSockets. Control lights, locks, climate, fans, and scenes, and view camera feeds directly from the UI.

### 🎨 Futuristic HUD & Deep Customization
*   **Dynamic Panel-Based UI:** A stunning and flexible interface built with React and Tailwind CSS. Major functions like Vision Mode, Settings, and the Control Center open in a dedicated side-panel, resizing the main chat view without ever overlapping it. This creates a true, non-colliding command center experience.
*   **Sleek Animations:** The interface features smooth, responsive animations for opening and closing panels, making the UI feel alive and high-tech.
*   **Theme Editor:** In-depth settings allow you to customize the entire look and feel:
    *   **Colors:** Change the primary UI color and panel background colors with a color picker or choose from presets.
    *   **Dynamic Persona:** Switch between the classic, helpful J.A.R.V.I.S. and the witty, sarcastic "Stark Protocol" persona to tailor your conversational experience.
    *   **Theme:** Switch between "Dark" and "Light" modes.
    *   **Visual Effects:** Toggle a background grid, scanline overlay, and a text flicker effect for the perfect sci-fi aesthetic.
*   **Custom Boot Sequence:** Choose between a holographic boot animation or upload your own video for a personalized system startup.

---

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS with a highly customized, themeable design system.
*   **AI Models:** Google Gemini API (`@google/genai`)
    *   **Chat & Vision:** `gemini-2.5-flash`
    *   **Image Generation:** `imagen-4.0-generate-001`
    *   **Image Editing:** `gemini-2.5-flash-image-preview`
    *   **Video Generation:** `veo-2.0-generate-001`
*   **Browser Storage:** IndexedDB for storing custom boot/shutdown videos and user-added application definitions.
*   **Web APIs:**
    *   **Web Speech API:** `SpeechRecognition` for voice input and `SpeechSynthesis` for voice output.
    *   **Web Audio API:** For generating procedural UI sound effects.
    *   **MediaDevices API:** `getUserMedia` for camera access in Vision Mode.
*   **Modules:** Loaded directly in the browser via `aistudiocdn.com` (no build step needed).

---

## 🚀 Getting Started

### Prerequisites

1.  A modern web browser (Chrome recommended for best Web API compatibility).
2.  A valid Google Gemini API key.
3.  (Optional) Google Cloud and Dropbox accounts for enabling cloud sync.

### Installation & Running

This project is designed to run directly in the browser without a build step.

1.  **Set up Environment Variables:**
    The application requires several secret keys to be configured as environment variables. You must ensure these variables are available in the environment where you serve the application.
    *   `API_KEY`: Your Google Gemini API key.
    *   `GOOGLE_CLIENT_ID`: (Optional) Your Google Cloud OAuth 2.0 Client ID for enabling Google Drive sync.
    *   `DROPBOX_CLIENT_ID`: (Optional) Your Dropbox App Client ID for enabling Dropbox sync.

2.  **(Optional) Configure OAuth for Cloud Sync:**
    To use the Google Drive or Dropbox sync features, you must configure their respective OAuth consent screens.
    *   **For Google Drive:**
        *   In your Google Cloud Console, under APIs & Services > Credentials, create an "OAuth 2.0 Client ID".
        *   Select "Web application" as the application type.
        *   Add the URL where you are hosting the application (e.g., `http://localhost:3000`) to both "Authorized JavaScript origins" and "Authorized redirect URIs".
    *   **For Dropbox:**
        *   In your Dropbox App Console, create a new app.
        *   Choose "Scoped access" and select the `files.content.write` and `account_info.read` permissions.
        *   Under the "Settings" tab, add the URL where you are hosting the application (e.g., `http://localhost:3000`) to the "Redirect URIs" section.

3.  **Serve the files:**
    Use any simple static file server to serve the project's root directory.
    ```bash
    # If you have Node.js installed, you can use the `serve` package
    npx serve
    ```

4.  **Open in Browser:**
    Navigate to the local server's address (e.g., `http://localhost:3000`).

5.  **Grant Permissions:**
    Upon first use of certain features, the application will request permission to use your **camera** (for Vision Mode) and **microphone** (for voice commands). You must grant these permissions for full functionality.

---

## 🤖 How It Works

### The J.A.R.V.I.S. Protocol

The core of the AI's functionality is defined by a detailed **system instruction** provided to the Gemini model (`services/aiOrchestrator.ts`). This prompt establishes the J.A.R.V.I.S. personality and defines a strict communication protocol. There are two main interaction modes:

1.  **Device Control Protocol:** When a user's command is interpreted as an action (like opening a URL or controlling a smart device), the AI is instructed to respond **only with a JSON object**. This structured data is then parsed by the frontend to execute the command. This prevents conversational filler and ensures reliable command execution.

2.  **Conversational Interaction:** For any other query, the AI engages in a natural, text-based conversation, adopting the J.A.R.V.I.S. persona.

### Application State & Components

The UI is controlled by a central `AppState` enum (`App.tsx`) which dictates the visual feedback for the user (e.g., `THINKING`, `LISTENING`, `SPEAKING`). The application is broken down into a series of modular components:

*   `App.tsx`: The root component that manages all state, user input, and orchestrates communication with services and panels.
*   `services/aiOrchestrator.ts`: A dedicated module for all interactions with the `@google/genai` SDK, containing the system prompt and API call logic.
*   `hooks/`: Reusable hooks for managing chat history, sound effects, speech synthesis, and speech recognition.
*   `components/`: A comprehensive library of UI components, including:
    *   `ChatLog.tsx`: The scrollable chat history panel.
    *   `TacticalSidebar.tsx`: The icon-based sidebar for launching modules.
    *   **Module Panels** (`VisionMode.tsx`, `GenerativeStudio.tsx`, etc.): Self-contained panels for the application's advanced features that appear in a dedicated screen area.

---

## 🔧 Troubleshooting

*   **API Key Not Valid Error:** This means the `API_KEY` environment variable is either not set or incorrect. Please double-check your setup from the [Getting Started](#getting-started) section.
*   **Cloud Sync Not Connecting:**
    *   Ensure you have set the `GOOGLE_CLIENT_ID` and/or `DROPBOX_CLIENT_ID` environment variables.
    *   Verify that you have correctly configured the "Authorized JavaScript origins" (for Google) and "Redirect URIs" (for both) in your cloud project settings to match the URL where you are running the application.
    *   Check your browser's console for any OAuth-related errors.
    *   Your browser might be blocking the authentication pop-up. Disable your pop-up blocker for this site and try again.
*   **Quota Exceeded Error:** You have made too many requests to the Gemini API in a short period. Please check your Google AI Platform quotas and billing status.
*   **Microphone/Camera Not Working:**
    *   Ensure you have granted the necessary permissions when the browser prompted you.
    *   If you denied them by accident, you'll need to go into your browser's site settings for this page and manually allow camera and microphone access.
    *   The Web Speech API for voice recognition is not supported in all browsers. For the best experience, use a modern version of Google Chrome.
*   **Custom Boot Video Fails to Load:** The video might be in an unsupported format, or there could be an issue with your browser's IndexedDB storage. Try using a standard `.mp4` file or clearing the site's storage data and re-uploading.