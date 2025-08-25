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
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  VISION = 'VISION',
  ERROR = 'ERROR'
}

export interface DeviceControlCommand {
    action: 'device_control';
    command: 'open_url' | 'search' | 'navigate' | 'unsupported' | 'internal_fulfillment' | 'play_music' | 'set_reminder' | 'set_alarm';
    app: string;
    params: any;
    spoken_response: string;
}

export type AICommand = DeviceControlCommand;

export interface KeyEntity {
  name: string;
  type: string; // e.g., PERSON, ORGANIZATION, LOCATION
}

export interface CyberAnalysisResult {
  title: string;
  summary: string;
  sentiment: {
    label: 'Positive' | 'Negative' | 'Neutral';
    score: number;
  };
  reliabilityScore: number;
  keyEntities: KeyEntity[];
}

export interface CodePrototype {
    language: string;
    code: string;
    explanation: string;
}

export interface TripPlanData {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  budget: string;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}