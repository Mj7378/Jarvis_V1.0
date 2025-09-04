# J.A.R.V.I.S. V1.0 - Advanced AI Assistant

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS Badge"/>
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Google Gemini Badge"/>
</div>
<br>

**J.A.R.V.I.S.** is a sophisticated, voice and text-enabled AI assistant inspired by Iron Man's iconic system. This web application demonstrates a powerful fusion of the Google Gemini API with a deeply customizable, futuristic Heads-Up Display (HUD), creating a feature-rich and immersive user experience.

This project serves as a comprehensive showcase for building complex AI applications using modern web technologies, focusing on advanced model integration, robust system control, and a high-quality, responsive interface.

---

## Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [System Architecture](#-system-architecture)
- [Troubleshooting](#-troubleshooting)
- [Future Development](#-future-development)

---

## ✨ Features

### 🧠 Conversational AI Core
- **Gemini-Powered Intelligence:** Leverages the `gemini-2.5-flash` model for fast, context-aware conversations, powered by a detailed system prompt that establishes the iconic J.A.R.V.I.S. persona.
- **Streaming Responses:** AI responses are streamed token-by-token for a natural, real-time conversational flow.
- **Google Search Grounding:** Provides up-to-date answers on recent events and trending topics by integrating Google Search directly into the AI's knowledge base.
- **Dynamic Persona:** Switch between the classic, helpful J.A.R.V.I.S. and the witty, sarcastic "Stark Protocol" to tailor your conversational experience.

### 🎙️ Multimodal Interaction
- **Voice Commands & Synthesis:** Full speech-to-text and text-to-speech capabilities enable hands-free operation and auditory feedback.
- **Voice Calibration:** A unique module analyzes your speech patterns to adjust the AI's response speed for a more synchronized conversation.
- **Versatile Attachments:** Go beyond text by uploading images for analysis, documents for summarization, audio for transcription, or sharing your location for contextual queries.

### 🚀 Advanced Generative Suite
- **👁️ Vision Mode:** Activate your camera to stream your surroundings, capture a frame, and ask J.A.R.V.I.S. to analyze and describe what it sees.
- **🎨 Image Studio:** Generate images from a text prompt using `imagen-4.0-generate-001`. Then, conversationally edit the image by adding objects, changing backgrounds, and more with the `gemini-2.5-flash-image-preview` model.
- **🎬 Simulation Mode:** Describe a scenario and generate a short video clip using the `veo-2.0-generate-001` model.

### ⚙️ System Control & Integrations
- **Reliable Command Protocol:** Utilizes a strict JSON-only protocol for device and system commands, ensuring high reliability and preventing conversational ambiguity.
- **Web App Launcher:** Open a suite of integrated web apps (YouTube, Gmail, GitHub, etc.) via voice or text commands, with the ability to add your own custom apps.
- **🏠 Home Automation:** Connects directly to your Home Assistant instance via WebSockets to control lights, locks, climate, and view camera feeds from the UI.

### 🎨 Futuristic HUD & Deep Customization
- **Dynamic Panel-Based UI:** A stunning and flexible interface built with React and Tailwind CSS. Modules open in a dedicated side-panel, resizing the main view for a true, non-colliding command center experience.
- **In-Depth Theme Editor:** Customize the entire look and feel, including primary/panel colors, visual effects (grid, scanlines), and light/dark modes.
- **Custom Boot/Shutdown:** Choose between a holographic animation or upload your own videos for a personalized system startup and shutdown sequence.

---

## 🛠️ Technology Stack

-   **Frontend:** React, TypeScript
-   **Styling:** Tailwind CSS with a highly customized, themeable design system.
-   **AI Models:** Google Gemini API (`@google/genai`)
    -   **Chat & Vision:** `gemini-2.5-flash`
    -   **Image Generation:** `imagen-4.0-generate-001`
    -   **Image Editing:** `gemini-2.5-flash-image-preview`
    -   **Video Generation:** `veo-2.0-generate-001`
-   **Browser Storage:** IndexedDB for storing custom media assets and user-defined application links.
-   **Web APIs:**
    -   **Web Speech API:** `SpeechRecognition` & `SpeechSynthesis`
    -   **Web Audio API:** For procedural UI sound effects
    -   **MediaDevices API:** `getUserMedia` for camera access

---

## 🚀 Getting Started

### Prerequisites

1.  A modern web browser (Chrome recommended for best Web API compatibility).
2.  A valid Google Gemini API key.

### Installation & Running

This project is designed to run directly in the browser without a build step.

1.  **Set up Environment Variables:**
    The application requires your Google Gemini API key to be configured as an environment variable. You must ensure this variable is available in the environment where you serve the application.
    *   `API_KEY`: Your Google Gemini API key.

2.  **Serve the files:**
    Use any simple static file server to serve the project's root directory.
    ```bash
    # If you have Node.js installed, you can use the `serve` package
    npx serve
    ```

3.  **Open in Browser:**
    Navigate to the local server's address (e.g., `http://localhost:3000`).

4.  **Grant Permissions:**
    Upon first use, the application will request permission to use your **camera** and **microphone**. You must grant these permissions for full functionality.

---

## 🤖 System Architecture

### The J.A.R.V.I.S. Protocol
The core of the AI's functionality is defined by a detailed **system instruction** provided to the Gemini model. This prompt establishes the J.A.R.V.I.S. personality and defines a strict, JSON-first communication protocol.

-   **Device Control:** When a command is interpreted as an action (e.g., opening a URL, controlling a smart device), the AI responds **only with a JSON object**. This structured data is then parsed by the frontend to execute the command, ensuring high reliability.
-   **Conversational Interaction:** For all other queries, the AI engages in natural, text-based conversation, adopting the specified persona.

### Application Structure
The UI is a single-page application built with React and controlled by a central state machine (`App.tsx`). This root component manages all state, user input, and orchestrates communication between services.

-   **`services/`:** Contains modules for all external interactions, most notably `aiOrchestrator.ts`, which handles all communication with the `@google/genai` SDK.
-   **`hooks/`:** Reusable hooks for managing sound effects, speech synthesis, and speech recognition.
-   **`components/`:** A comprehensive library of UI components, including the main chat log, the tactical sidebar, and self-contained panels for advanced features like Vision Mode and the Generative Studio.

---

## 🔧 Troubleshooting

-   **API Key Not Valid Error:** The `API_KEY` environment variable is either not set or incorrect. Please double-check your setup.
-   **Quota Exceeded Error:** You have exceeded your request limit for the Gemini API. Check your Google AI Platform quotas and billing status.
-   **Microphone/Camera Not Working:**
    -   Ensure you have granted the necessary browser permissions. If you denied them accidentally, you must change the site settings for this page in your browser to allow access.
    -   The Web Speech API is not supported in all browsers. For the best experience, use a modern version of Google Chrome.
-   **Custom Boot Video Fails to Load:** The video may be in an unsupported format, or there could be an issue with IndexedDB storage. Try using a standard `.mp4` file or clearing the site's storage data and re-uploading.

---

## 🗺️ Future Development

This section outlines potential future development paths for the project.

-   **Mobile Application (React Native)**
    -   **Shared Core Logic:** The platform-agnostic TypeScript logic (e.g., `aiOrchestrator.ts`) can be extracted into a shared library.
    -   **Native UI Layer:** A new UI layer built with React Native for a truly native experience on iOS and Android.
    -   **Native Modules:** Leverage native capabilities for features like secure authentication, background tasks, and deeper system integration.

-   **Cloud Storage Integration (Dropbox, Google Drive)**
    -   **Secure Authentication:** Implement robust OAuth 2.0 flows for users to securely connect their accounts.
    -   **File Management & Analysis:** Allow users to browse, select, and have the AI analyze documents directly from their cloud storage.

-   **Proactive Information Synthesis**
    -   Integrate with personal information services (e.g., email, calendar) to proactively provide warnings, surface relevant documents for upcoming meetings, and offer timely information without being prompted.

-   **Advanced Agency & Tool Use**
    -   Implement dynamic action chaining, where the output of one tool can be used as the input for the next, enabling more complex, multi-step tasks.
    -   Explore screen context awareness to allow J.A.R.V.I.S. to "see" and interact with the content the user is currently viewing.