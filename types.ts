




export interface Source {
  uri: string;
  title?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
}

export interface ChartData {
  type: 'bar'; // For now, only support bar charts
  title: string;
  labels: string[];
  datasets: ChartDataset[];
}


export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  sources?: Source[];
  timestamp: string;
  chartData?: ChartData;
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
    command: 'open_url' | 'search' | 'navigate' | 'internal_fulfillment' | 'play_music' | 'set_reminder' | 'set_alarm' | 'shutdown' | 'app_control' | 'home_automation' | 'wolfram_alpha_query' | 'native_app_control' | 'file_system_access' | 'hardware_control';
    app: string;
    params: any & {
        action?: string;
        value?: any;
    };
    spoken_response: string;
    lang?: string;
    suggestions?: string[];
}

export interface ConversationalResponse {
    action: 'conversational_response';
    text: string; // Full text with markdown for display
    spoken_text: string; // Clean text for TTS
    lang: string; // BCP-47 code
    suggestions?: string[];
}

export interface ChartVisualizationCommand {
    action: 'chart_visualization';
    spoken_response: string;
    lang?: string;
    chart_data: ChartData;
    summary_text: string;
    suggestions?: string[];
}

export interface MultiToolUseCommand {
    action: 'multi_tool_use';
    spoken_response: string; // A summary of the entire plan
    lang?: string;
    steps: DeviceControlCommand[]; // An array of commands to execute sequentially
    suggestions?: string[];
}

export type AICommand = DeviceControlCommand | ChartVisualizationCommand | MultiToolUseCommand | ConversationalResponse;


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
  uiSoundsEnabled: boolean;
  soundProfile: 'default' | 'futuristic' | 'retro';
  voiceProfiles: VoiceProfile[];
  activeVoiceProfileId: string | null;
  wakeWord: string;
  wakeWordEnabled: boolean;
  aiProvider: 'automatic' | 'google_gemini' | 'pica_ai';
  persona: 'classic' | 'stark';
  homeAssistantUrl: string;
  homeAssistantToken: string;
  dropboxClientId: string;
  googleApiKey: string;
  googleClientId: string;
}

export interface Task {
  id: string;
  content: string;
  initialDueDate: number; // The first time it's due
  nextDueDate: number; // The next time it's due
  recurrence: 'daily' | 'weekly' | 'weekdays' | 'weekends' | null;
  completed: boolean;
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

export type PanelType = 
    | 'CONTROL_CENTER' 
    | 'VISION' 
    | 'GENERATIVE_STUDIO' 
    | 'SETTINGS' 
    | 'APP_LAUNCHER' 
    | 'TASK_MANAGER'
    | 'STORAGE_WIZARD';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;

    gapi: any;
    google: any;
  }
}