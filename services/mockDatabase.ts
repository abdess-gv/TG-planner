import { Session, User, AppSettings, Speaker, Subscriber } from '../types';
import { INITIAL_USERS, MOCK_SESSIONS, INITIAL_SETTINGS, MOCK_SPEAKERS } from '../constants';

const KEYS = {
  SESSIONS: 'app_sessions',
  USERS: 'app_users',
  SETTINGS: 'app_settings',
  SPEAKERS: 'app_speakers'
};

export const db = {
  // --- SESSIONS ---
  getSessions: (): Session[] => {
    const stored = localStorage.getItem(KEYS.SESSIONS);
    return stored ? JSON.parse(stored) : MOCK_SESSIONS;
  },
  saveSession: (session: Session) => {
    const sessions = db.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },
  deleteSession: (id: string) => {
    const sessions = db.getSessions();
    const filtered = sessions.filter(s => s.id !== id);
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(filtered));
  },
  addSubscriberToSession: (sessionId: string, subscriber: Subscriber) => {
    const sessions = db.getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index >= 0) {
      if (!sessions[index].subscribers) sessions[index].subscribers = [];
      sessions[index].subscribers.push(subscriber);
      localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
    }
  },

  // --- USERS ---
  getUsers: (): User[] => {
    const stored = localStorage.getItem(KEYS.USERS);
    return stored ? JSON.parse(stored) : INITIAL_USERS;
  },
  saveUser: (user: User) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },
  deleteUser: (id: string) => {
    const users = db.getUsers();
    // Prevent deleting the last admin
    if (users.find(u => u.id === id)?.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length <= 1) {
      throw new Error("Kan de laatste beheerder niet verwijderen.");
    }
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS, JSON.stringify(filtered));
  },

  // --- SPEAKERS ---
  getSpeakers: (): Speaker[] => {
    const stored = localStorage.getItem(KEYS.SPEAKERS);
    return stored ? JSON.parse(stored) : MOCK_SPEAKERS;
  },
  saveSpeaker: (speaker: Speaker) => {
    const speakers = db.getSpeakers();
    const index = speakers.findIndex(s => s.id === speaker.id);
    if (index >= 0) {
      speakers[index] = speaker;
    } else {
      speakers.push(speaker);
    }
    localStorage.setItem(KEYS.SPEAKERS, JSON.stringify(speakers));
  },
  deleteSpeaker: (id: string) => {
    const speakers = db.getSpeakers();
    const filtered = speakers.filter(s => s.id !== id);
    localStorage.setItem(KEYS.SPEAKERS, JSON.stringify(filtered));
  },

  // --- SETTINGS ---
  getSettings: (): AppSettings => {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : INITIAL_SETTINGS;
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- BACKUP & RESTORE ---
  exportData: (): string => {
    const data = {
      sessions: db.getSessions(),
      users: db.getUsers(),
      speakers: db.getSpeakers(),
      settings: db.getSettings(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },
  
  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.sessions) localStorage.setItem(KEYS.SESSIONS, JSON.stringify(data.sessions));
      if (data.users) localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
      if (data.speakers) localStorage.setItem(KEYS.SPEAKERS, JSON.stringify(data.speakers));
      if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  }
};
