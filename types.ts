export interface Source {
  uri: string;
  title?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  sources?: Source[];
}

export enum AppState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  VISION = 'VISION',
  ERROR = 'ERROR',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
}

export interface DeviceControlCommand {
    action: 'device_control';
    command: 'open_url' | 'search' | 'navigate' | 'unsupported' | 'internal_fulfillment' | 'play_music' | 'set_reminder' | 'set_alarm';
    app: string;
    params: any;
    spoken_response: string;
    lang?: string;
}

export type AICommand = DeviceControlCommand;

export interface AppError {
  code: string;
  title: string;
  message: string;
  details?: string;
  action?: string;
}

export interface ThemeSettings {
  primaryColor: string;
  panelColor: string;
  showGrid: boolean;
  showScanlines: boolean;
  showTextFlicker: boolean;
  hasCustomBootVideo: boolean;
  bootupAnimation: 'holographic' | 'video';
  voiceOutputEnabled: boolean;
  uiSoundsEnabled: boolean;
  voiceProfile: {
    rate: number;
    pitch: number;
  };
  wakeWord: string;
  aiModel: 'gemini-2.5-flash' | 'gemini-pro';
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
