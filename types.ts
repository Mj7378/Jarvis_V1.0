export interface Source {
  uri: string;
  title?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  sources?: Source[];
  timestamp: string;
}

export enum AppState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  VISION = 'VISION',
  ERROR = 'ERROR',
  SPEAKING = 'SPEAKING',
  LISTENING = 'LISTENING',
}

export interface DeviceControlCommand {
    action: 'device_control';
    command: 'open_url' | 'search' | 'navigate' | 'unsupported' | 'internal_fulfillment' | 'play_music' | 'set_reminder' | 'set_alarm' | 'shutdown' | 'app_control' | 'home_automation';
    app: string;
    params: any & {
        action?: string;
        value?: any;
    };
    spoken_response: string;
    lang?: string;
    suggestions?: string[];
}

export type AICommand = DeviceControlCommand;

export interface AppError {
  code: string;
  title: string;
  message: string;
  details?: string;
  action?: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  rate: number;
  pitch: number;
}

export interface ThemeSettings {
  primaryColor: string;
  panelColor: string;
  themeMode: 'dark' | 'light';
  showGrid: boolean;
  showScanlines: boolean;
  showTextFlicker: boolean;
  hasCustomBootVideo: boolean;
  hasCustomShutdownVideo: boolean;
  bootupAnimation: 'holographic' | 'video';
  voiceOutputEnabled: boolean;
  uiSoundsEnabled: boolean;
  soundProfile: 'default' | 'futuristic' | 'retro';
  voiceProfiles: VoiceProfile[];
  activeVoiceProfileId: string | null;
  wakeWord: string;
  aiModel: 'gemini-2.5-flash';
  hudLayout: 'classic' | 'tactical';
}

export interface Reminder {
  id: string;
  content: string;
  dueTime: number; // timestamp
}

export interface WeatherData {
  temperature: number;
  condition: string;
  high: number;
  low: number;
  precipitation: number;
  city: string;
  day: string;
}

export interface SmartHomeState {
    lights: {
        [key: string]: boolean; // room: isOn
    };
    thermostat: number; // in Celsius
    security: {
        frontDoorLocked: boolean;
    };
    appliances: {
        ceilingFan: 'off' | 'low' | 'high';
        airPurifier: boolean;
    };
}


declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}