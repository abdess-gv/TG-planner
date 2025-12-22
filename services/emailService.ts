import { Session, Speaker, Subscriber } from "../types";
import { db } from "./mockDatabase";

// Helper to send data to a webhook if configured
const postToWebhook = async (type: string, payload: any) => {
    const settings = db.getSettings();
    if (settings.emailWebhookUrl && settings.enableEmailNotifications) {
        try {
            await fetch(settings.emailWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, ...payload })
            });
            console.log(`[EMAIL-SERVICE] Webhook sent to ${settings.emailWebhookUrl}`);
            return true;
        } catch (e) {
            console.error('[EMAIL-SERVICE] Webhook failed', e);
            return false;
        }
    } else {
        console.log('[EMAIL-SERVICE] No webhook configured or emails disabled. Mocking success.');
        return true;
    }
};

export const emailService = {
  sendSpeakerInvite: async (speaker: Speaker, session: Session, isCoHost: boolean): Promise<boolean> => {
    const meetLink = session.googleMeetLink || session.location;
    
    // Log for debugging
    console.log(`--- SENDING INVITE: ${speaker.email} ---`);
    
    // Attempt real send via webhook
    await postToWebhook('SPEAKER_INVITE', {
        to: speaker.email,
        name: speaker.name,
        sessionTitle: session.title,
        date: session.date,
        time: `${session.startTime} - ${session.endTime}`,
        location: session.location,
        meetLink: meetLink,
        isCoHost
    });
    
    return new Promise(resolve => setTimeout(() => resolve(true), 800));
  },

  sendStudentConfirmation: async (studentEmail: string, studentName: string, session: Session): Promise<boolean> => {
    console.log(`--- SENDING CONFIRMATION: ${studentEmail} ---`);
    
    await postToWebhook('STUDENT_CONFIRMATION', {
        to: studentEmail,
        name: studentName,
        sessionTitle: session.title,
        date: session.date,
        time: session.startTime,
        location: session.location
    });
    
    return new Promise(resolve => setTimeout(() => resolve(true), 600));
  },

  scheduleReminders: async (session: Session, subscribers: Subscriber[]): Promise<void> => {
    // In a real frontend-only app, scheduling is hard. 
    // This function would typically send a payload to the webhook with a "delay" or "schedule_at" parameter
    // if the webhook provider supports it (like Zapier Delay).
    if (subscribers.length === 0) return;

    if (session.reminders.remind24h || session.reminders.remind1h) {
         console.log(`[SCHEDULER] Sending scheduling request for ${subscribers.length} subscribers`);
         await postToWebhook('SCHEDULE_REMINDERS', {
             sessionId: session.id,
             reminders: session.reminders,
             subscribers: subscribers.map(s => s.email)
         });
    }
  }
};
