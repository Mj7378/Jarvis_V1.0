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
  AWAITING_WAKE_WORD = 'AWAITING_WAKE_WORD',
}

export interface DeviceControlCommand {
    action: 'device_control';
    command: 'open_url' | 'search' | 'navigate' | 'internal_fulfillment' | 'play_music' | 'set_reminder' | 'set_alarm' | 'shutdown' | 'app_control' | 'home_automation' | 'wolfram_alpha_query';
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
  wakeWordEnabled: boolean;
  aiProvider: 'automatic' | 'google_gemini' | 'pica_ai';
  hudLayout: 'classic' | 'tactical';
  persona: 'classic' | 'stark';
  homeAssistantUrl: string;
  homeAssistantToken: string;
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

// Home Assistant Types
export interface HaEntityAttributes {
  friendly_name?: string;
  [key: string]: any;
}

export interface HaEntity {
  entity_id: string;
  state: string;
  attributes: HaEntityAttributes;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

export interface SmartHomeState {
    entities: {
        [entityId: string]: HaEntity;
    };
}

export interface CustomAppDefinition {
  id: string;
  name: string;
  url: string;
  // For now, only text-based icons are supported for custom apps.
  iconType: 'text';
  iconValue: string; // The character to display
  bgColor: string;
  textColor: string;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}