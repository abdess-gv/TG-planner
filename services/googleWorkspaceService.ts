import { Session, Speaker } from "../types";
import { db } from "./mockDatabase";

export const googleWorkspaceService = {
  
  /**
   * Creates a Google Meet link
   */
  createMeetingLink: async (): Promise<string> => {
    // In production with OAuth, this would call the Calendar API to insert an event with 'conferenceData'.
    // Here we generate a realistic format or check if an API Key is present for future expansion.
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fallback Mock
    const randomStr = Math.random().toString(36).substring(7);
    return `https://meet.google.com/${randomStr}-prod`;
  },

  /**
   * Adds a speaker to the calendar event
   */
  addSpeakerToEvent: async (session: Session, speaker: Speaker, isCoHost: boolean): Promise<boolean> => {
    const settings = db.getSettings();
    console.log(`[WORKSPACE] Processing event for ${session.title}`);

    if (settings.googleCalendarId) {
        console.log(`[WORKSPACE] Targeting Calendar ID: ${settings.googleCalendarId}`);
        // Here code would go to use gapi.client.calendar.events.patch
        // to add the speaker email to the attendees list.
    } else {
        console.warn("[WORKSPACE] No Google Calendar ID configured in settings.");
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  },

  /**
   * Syncs the entire session to Google Calendar
   */
  syncSessionToCalendar: async (session: Session): Promise<void> => {
    const settings = db.getSettings();
    
    console.log('--- SYNC START ---');
    
    if (!settings.googleCalendarId) {
        console.warn('Skipping real sync: No Calendar ID set in Settings.');
        return;
    }

    if (settings.emailWebhookUrl) {
         // OPTION: We can also use the webhook to let an automation tool (Zapier) create the calendar event
         // This is often easier than handling OAuth in a pure frontend app.
         console.log('Sending Calendar Sync request via Webhook...');
         try {
            await fetch(settings.emailWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'SYNC_CALENDAR_EVENT',
                    calendarId: settings.googleCalendarId,
                    session: session
                })
            });
         } catch(e) {
             console.error("Webhook sync failed", e);
         }
    }

    // Simulate network request for UI feedback
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('--- SYNC COMPLETE ---');
  }
};
