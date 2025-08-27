export interface Resume {
  id: string;
  fileName: string;
  content: string;
  skills: string[];
  experience: string[];
  education: string[];
  uploadedAt: Date;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'experience' | 'role-specific';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedDuration: number; // in seconds
}

export interface InterviewResponse {
  questionId: string;
  response: string;
  audioUrl?: string;
  duration: number;
  timestamp: Date;
}

export interface InterviewSession {
  id: string;
  resumeId: string;
  role: string;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  currentQuestionIndex: number;
  status: 'preparing' | 'active' | 'paused' | 'completed';
  startTime: Date;
  endTime?: Date;
  score?: number;
}

export interface VoiceSettings {
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface MurfVoice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  accent: string;
  language: string;
  preview_url?: string;
}