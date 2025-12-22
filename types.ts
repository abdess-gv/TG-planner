export enum Program {
  PATHWAYS = 'Pathways Oriëntatie',
  AI_READY = 'AI Ready',
  WORK_READY = 'Work Ready',
  GENERAL = 'Algemeen'
}

export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export enum RecurrenceFrequency {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: Role;
  email?: string;
  picture?: string;
}

export interface Speaker {
  id: string;
  name: string;
  email: string;
  roleOrTitle: string;
  bio?: string;
  photoUrl?: string;
}

export interface Subscriber {
  email: string;
  name: string;
  subscribedAt: string; // ISO Date
}

export interface SessionSpeakerConfig {
  speakerId: string;
  isCoHost: boolean;
  inviteStatus: 'NOT_SENT' | 'SENT' | 'ACCEPTED' | 'DECLINED';
}

export interface ReminderSettings {
  remind24h: boolean;
  remind1h: boolean;
}

export interface Session {
  id: string;
  title: string;
  program: Program;
  description: string;
  internalNotes?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  googleMeetLink?: string; // Specific link for the video call
  applicationLink?: string;
  recordingLink?: string;
  maxParticipants?: number;
  imageUrl?: string;
  
  // Updated field
  speakers: SessionSpeakerConfig[];
  
  subscribers: Subscriber[];
  enableNativeSignup: boolean;
  reminders: ReminderSettings;
}

export interface AppSettings {
  organizationName: string;
  
  // Google Workspace
  googleCalendarId: string;
  googleClientId?: string; // For real OAuth
  googleApiKey?: string; // For real GAPI
  
  // Integrations
  emailWebhookUrl?: string; // e.g. Zapier/Make webhook for sending real emails
  enableEmailNotifications: boolean;
}