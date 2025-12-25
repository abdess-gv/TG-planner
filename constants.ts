import { Program, Role, User, Session, AppSettings, Speaker } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: '1',
    name: 'Hoofdbeheerder',
    pin: '1102',
    role: Role.ADMIN,
    email: 'admin@organisatie.nl'
  },
  {
    id: '2',
    name: 'Docent',
    pin: '0000',
    role: Role.TEACHER,
    email: 'docent@organisatie.nl'
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  googleCalendarId: '',
  organizationName: 'Mijn Organisatie',
  enableEmailNotifications: true
};

export const MOCK_SPEAKERS: Speaker[] = [
  {
    id: 'sp1',
    name: 'Dr. Sarah Jansen',
    email: 'sarah.jansen@example.com',
    roleOrTitle: 'AI Ethics Researcher',
    bio: 'Expert in ethische vraagstukken rondom generatieve AI.'
  },
  {
    id: 'sp2',
    name: 'Mark de Vries',
    email: 'mark.vries@example.com',
    roleOrTitle: 'Senior Recruiter',
    bio: 'Meer dan 10 jaar ervaring in tech recruitment.'
  }
];

// Helper to get a future date string
const getFutureDate = (daysToAdd: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};

export const MOCK_SESSIONS: Session[] = [
  {
    id: '1',
    title: 'Introductie AI Ready',
    program: Program.AI_READY,
    description: 'Een kennismaking met de basisprincipes van Kunstmatige Intelligentie en wat je kunt verwachten van het programma.',
    date: getFutureDate(7), // 1 week from now
    startTime: '10:00',
    endTime: '11:30',
    location: 'Online',
    googleMeetLink: 'https://meet.google.com/abc-defg-hij',
    applicationLink: 'https://forms.google.com/example',
    maxParticipants: 30,
    speakers: [
      { speakerId: 'sp1', isCoHost: true, inviteStatus: 'ACCEPTED' }
    ],
    subscribers: [],
    enableNativeSignup: false,
    reminders: { remind24h: true, remind1h: true }
  },
  {
    id: '2',
    title: 'Sollicitatiegesprek Training',
    program: Program.WORK_READY,
    description: 'Leer effectieve technieken voor je volgende sollicitatiegesprek. We oefenen met veelgestelde vragen.',
    date: getFutureDate(14), // 2 weeks from now
    startTime: '14:00',
    endTime: '16:00',
    location: 'Lokaal 3.02',
    maxParticipants: 15,
    speakers: [
      { speakerId: 'sp2', isCoHost: false, inviteStatus: 'SENT' }
    ],
    subscribers: [],
    enableNativeSignup: true,
    reminders: { remind24h: true, remind1h: false }
  },
  {
    id: '3',
    title: 'Pathways Kick-off',
    program: Program.PATHWAYS,
    description: 'De start van jouw reis. Ontmoet je mentoren en medestudenten.',
    date: getFutureDate(30), // 1 month from now
    startTime: '09:00',
    endTime: '12:00',
    location: 'Hoofd Aula',
    maxParticipants: 100,
    speakers: [],
    subscribers: [],
    enableNativeSignup: true,
    reminders: { remind24h: true, remind1h: true }
  }
];