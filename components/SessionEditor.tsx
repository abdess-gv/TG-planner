import React, { useState, useEffect } from 'react';
import { Session, Program, Speaker, SessionSpeakerConfig, RecurrenceFrequency } from '../types';
import { db } from '../services/mockDatabase';
import { generateSessionDescription, generateSessionImage } from '../services/geminiService';
import { emailService } from '../services/emailService';
import { googleWorkspaceService } from '../services/googleWorkspaceService';
import { Sparkles, X, Loader2, Image as ImageIcon, Video, Bell, UserPlus, CheckCircle, Send, ShieldCheck, Link, Calendar as CalendarIcon, Repeat, Trash2 } from 'lucide-react';
import { add, format } from 'date-fns';

interface SessionEditorProps {
  session?: Session;
  onSave: (sessions: Session | Session[]) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const SessionEditor: React.FC<SessionEditorProps> = ({ session, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState<Partial<Session>>({
    title: '',
    program: Program.GENERAL,
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    googleMeetLink: '',
    maxParticipants: undefined,
    applicationLink: '',
    recordingLink: '',
    imageUrl: '',
    speakers: [],
    enableNativeSignup: true,
    reminders: { remind24h: true, remind1h: true },
    subscribers: []
  });

  const [recurrence, setRecurrence] = useState<{enabled: boolean, frequency: RecurrenceFrequency, count: number}>({
    enabled: false,
    frequency: RecurrenceFrequency.WEEKLY,
    count: 4
  });

  const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [invitingSpeakerId, setInvitingSpeakerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imgSize, setImgSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [error, setError] = useState('');

  useEffect(() => {
    setAvailableSpeakers(db.getSpeakers());
    if (session) {
      setFormData(session);
    }
  }, [session]);

  const handleChange = (field: keyof Session, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Speaker Management ---

  const isSpeakerSelected = (id: string) => {
    return formData.speakers?.some(s => s.speakerId === id);
  };

  const toggleSpeaker = (speakerId: string) => {
    setFormData(prev => {
      const current = prev.speakers || [];
      if (current.some(s => s.speakerId === speakerId)) {
        return { ...prev, speakers: current.filter(s => s.speakerId !== speakerId) };
      } else {
        return { 
            ...prev, 
            speakers: [...current, { speakerId, isCoHost: false, inviteStatus: 'NOT_SENT' }] 
        };
      }
    });
  };

  const updateSpeakerConfig = (speakerId: string, updates: Partial<SessionSpeakerConfig>) => {
    setFormData(prev => ({
        ...prev,
        speakers: prev.speakers?.map(s => s.speakerId === speakerId ? { ...s, ...updates } : s)
    }));
  };

  const handleInviteSpeaker = async (config: SessionSpeakerConfig) => {
    const speaker = availableSpeakers.find(s => s.id === config.speakerId);
    if (!speaker) return;
    
    setInvitingSpeakerId(config.speakerId);
    
    try {
        let currentLink = formData.googleMeetLink;

        // Automatically generate Meet link if missing
        if (!currentLink) {
            currentLink = await googleWorkspaceService.createMeetingLink();
            handleChange('googleMeetLink', currentLink);
            if (!formData.location) {
                handleChange('location', 'Online (Google Meet)');
            }
        }

        // Use the updated link for the invitation
        const sessionForInvite: Session = {
            ...formData as Session,
            googleMeetLink: currentLink,
            location: formData.location || 'Online (Google Meet)'
        };

        // 1. Add to Google Calendar Event (Mock/API)
        await googleWorkspaceService.addSpeakerToEvent(sessionForInvite, speaker, config.isCoHost);
        
        // 2. Send Email Invite (Webhook/Mock)
        await emailService.sendSpeakerInvite(speaker, sessionForInvite, config.isCoHost);
        
        // 3. Update status
        updateSpeakerConfig(config.speakerId, { inviteStatus: 'SENT' });
        
        // Save the generated link back to form data just in case
        setFormData(prev => ({
            ...prev,
            googleMeetLink: currentLink,
            location: prev.location || 'Online (Google Meet)'
        }));

    } catch (e) {
        console.error(e);
        alert("Fout bij versturen uitnodiging: " + e);
    } finally {
        setInvitingSpeakerId(null);
    }
  };

  const generateMeetLink = async () => {
    const link = await googleWorkspaceService.createMeetingLink();
    handleChange('googleMeetLink', link);
    if (!formData.location) handleChange('location', 'Online (Google Meet)');
  };

  // --- AI & Form Handlers ---

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.program) {
      setError('Vul eerst een titel en programma in om AI te gebruiken.');
      return;
    }
    setError('');
    setIsGeneratingText(true);
    try {
      const result = await generateSessionDescription(formData.title, formData.program);
      setFormData(prev => ({ 
        ...prev, 
        description: result.description,
        internalNotes: result.sources.length > 0 ? `Bronnen:\n${result.sources.join('\n')}` : prev.internalNotes
      }));
    } catch (e) {
      setError('Kon geen beschrijving genereren. Probeer het later opnieuw.');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleGenerateImage = async () => {
     if (!formData.title) {
      setError('Vul een titel in om een afbeelding te genereren.');
      return;
    }
    setError('');
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateSessionImage(formData.title, imgSize);
      setFormData(prev => ({ ...prev, imageUrl }));
    } catch (e) {
      setError('Kon geen afbeelding genereren. ' + e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.program) {
      setError('Vul alle verplichte velden in.');
      return;
    }
    
    setIsSaving(true);

    try {
        const sessionsToSave: Session[] = [];
        const baseSession: Session = {
          id: session?.id || crypto.randomUUID(),
          ...formData as Session
        };
        
        sessionsToSave.push(baseSession);
        
        // Generate Recurring Sessions
        if (!session && recurrence.enabled && recurrence.frequency !== RecurrenceFrequency.NONE && recurrence.count > 1) {
            const baseDate = new Date(baseSession.date);
            
            for (let i = 1; i < recurrence.count; i++) {
                let nextDate = baseDate;
                
                if (recurrence.frequency === RecurrenceFrequency.DAILY) {
                    nextDate = add(baseDate, { days: i });
                } else if (recurrence.frequency === RecurrenceFrequency.WEEKLY) {
                    nextDate = add(baseDate, { weeks: i });
                } else if (recurrence.frequency === RecurrenceFrequency.MONTHLY) {
                    nextDate = add(baseDate, { months: i });
                }

                // Create a clone
                const nextSession: Session = {
                    ...baseSession,
                    id: crypto.randomUUID(), // New ID
                    date: format(nextDate, 'yyyy-MM-dd'),
                    subscribers: [] // Don't copy subscribers to future events
                };
                sessionsToSave.push(nextSession);
            }
        }

        // Sync all generated sessions to Google Calendar
        for (const s of sessionsToSave) {
            await googleWorkspaceService.syncSessionToCalendar(s);
        }
        
        onSave(sessionsToSave);

    } catch (e) {
        setError('Opslaan mislukt: ' + e);
        setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {session ? 'Sessie Bewerken' : 'Nieuwe Sessie Plannen'}
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Bijv. Introductie Python"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Programma *</label>
              <select
                value={formData.program}
                onChange={(e) => handleChange('program', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none"
              >
                {Object.values(Program).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Beschrijving
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingText}
                  className="ml-2 text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
                >
                  {isGeneratingText ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Schrijven
                </button>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={5}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="Beschrijf de inhoud van de sessie..."
              />
            </div>

            {/* Recurrence Section (Only for new sessions to keep logic simple) */}
            {!session && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <label className="flex items-center text-sm font-bold text-purple-800 mb-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={recurrence.enabled}
                            onChange={(e) => setRecurrence(prev => ({...prev, enabled: e.target.checked}))}
                            className="mr-2 text-primary rounded"
                        />
                        <Repeat className="w-4 h-4 mr-1" />
                        Sessie Herhalen
                    </label>
                    
                    {recurrence.enabled && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-purple-700 mb-1">Frequentie</label>
                                <select
                                    value={recurrence.frequency}
                                    onChange={(e) => setRecurrence(prev => ({...prev, frequency: e.target.value as RecurrenceFrequency}))}
                                    className="w-full text-sm border-purple-200 rounded px-2 py-1"
                                >
                                    <option value={RecurrenceFrequency.DAILY}>Dagelijks</option>
                                    <option value={RecurrenceFrequency.WEEKLY}>Wekelijks</option>
                                    <option value={RecurrenceFrequency.MONTHLY}>Maandelijks</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-purple-700 mb-1">Aantal Keer</label>
                                <input 
                                    type="number" 
                                    min="2"
                                    max="52"
                                    value={recurrence.count}
                                    onChange={(e) => setRecurrence(prev => ({...prev, count: parseInt(e.target.value)}))}
                                    className="w-full text-sm border-purple-200 rounded px-2 py-1"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Enhanced Speaker Selection */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                 <UserPlus className="w-4 h-4" /> Sprekers & Co-hosts
               </label>
               
               <div className="mb-4">
                 <select 
                    className="w-full text-sm border-slate-300 rounded-lg"
                    onChange={(e) => {
                        if(e.target.value) {
                            toggleSpeaker(e.target.value);
                            e.target.value = '';
                        }
                    }}
                 >
                    <option value="">+ Voeg spreker toe...</option>
                    {availableSpeakers.filter(sp => !isSpeakerSelected(sp.id)).map(sp => (
                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                 </select>
               </div>

               <div className="space-y-3">
                 {formData.speakers?.map(config => {
                   const sp = availableSpeakers.find(s => s.id === config.speakerId);
                   if (!sp) return null;
                   
                   return (
                     <div key={config.speakerId} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-sm text-slate-800">{sp.name}</p>
                                <p className="text-xs text-slate-500">{sp.email}</p>
                            </div>
                            <button type="button" onClick={() => toggleSpeaker(config.speakerId)} className="text-slate-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer" title="Geef presentatie- en beheerrechten in Google Meet">
                                <input 
                                    type="checkbox" 
                                    checked={config.isCoHost} 
                                    onChange={(e) => updateSpeakerConfig(config.speakerId, { isCoHost: e.target.checked })}
                                    className="text-primary rounded"
                                />
                                <ShieldCheck className="w-3 h-3" />
                                Co-host
                            </label>

                            {config.inviteStatus === 'SENT' || config.inviteStatus === 'ACCEPTED' ? (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                    <CheckCircle className="w-3 h-3" /> Uitgenodigd
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleInviteSpeaker(config)}
                                    disabled={invitingSpeakerId === config.speakerId}
                                    className="flex items-center gap-1 text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 transition shadow-sm"
                                >
                                    {invitingSpeakerId === config.speakerId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    Nodig uit & Link sturen
                                </button>
                            )}
                        </div>
                     </div>
                   );
                 })}
                 {formData.speakers?.length === 0 && (
                   <p className="text-xs text-slate-500 italic text-center py-2">Nog geen sprekers geselecteerd.</p>
                 )}
               </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               {/* Image Gen logic */}
               <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-slate-700">Cover Afbeelding</label>
                 <div className="flex items-center gap-2">
                   <select 
                      value={imgSize} 
                      onChange={(e) => setImgSize(e.target.value as any)}
                      className="text-xs border border-slate-300 rounded px-1 py-0.5"
                    >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                   </select>
                   <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className="text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-1"
                   >
                     {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                     Genereer
                   </button>
                 </div>
               </div>
               
               {formData.imageUrl ? (
                 <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-200 group">
                   <img src={formData.imageUrl} alt="Cover" className="w-full h-full object-cover" />
                   <button 
                    type="button"
                    onClick={() => handleChange('imageUrl', '')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 </div>
               ) : (
                 <div className="aspect-video rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm">
                   Geen afbeelding
                 </div>
               )}
             </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Datum *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Start *</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleChange('startTime', e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none"
                      required
                    />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Eind *</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleChange('endTime', e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none"
                      required
                    />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Locatie</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none mb-2"
                placeholder="Bijv. Lokaal 2..."
              />
              
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                 Google Meet Link 
                 <button type="button" onClick={generateMeetLink} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Video className="w-3 h-3" /> Genereer Link
                 </button>
              </label>
              <div className="relative">
                 <Link className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                 <input
                    type="url"
                    value={formData.googleMeetLink || ''}
                    onChange={(e) => handleChange('googleMeetLink', e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none text-sm font-mono text-slate-600"
                    placeholder="https://meet.google.com/..."
                  />
              </div>
            </div>

            {/* Inschrijving & Herinneringen */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                   <label className="flex items-center text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.enableNativeSignup} 
                        onChange={(e) => handleChange('enableNativeSignup', e.target.checked)}
                        className="mr-2 text-primary rounded"
                      />
                      Gebruik interne inschrijfmodule
                   </label>
                   
                   {!formData.enableNativeSignup && (
                     <input
                      type="url"
                      value={formData.applicationLink || ''}
                      onChange={(e) => handleChange('applicationLink', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="Of plak een externe link (Google Forms)..."
                     />
                   )}
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Automatische Herinneringen
                  </h4>
                  <div className="space-y-1">
                    <label className="flex items-center text-sm text-blue-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.reminders?.remind24h} 
                        onChange={(e) => setFormData(prev => ({...prev, reminders: {...prev.reminders!, remind24h: e.target.checked}}))}
                        className="mr-2 rounded"
                      />
                      Stuur 1 dag van tevoren
                    </label>
                    <label className="flex items-center text-sm text-blue-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.reminders?.remind1h} 
                        onChange={(e) => setFormData(prev => ({...prev, reminders: {...prev.reminders!, remind1h: e.target.checked}}))}
                        className="mr-2 rounded"
                      />
                      Stuur 1 uur van tevoren
                    </label>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <div>
            {session && onDelete && (
                <button
                type="button"
                onClick={() => onDelete(session.id)}
                className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition flex items-center gap-2"
                >
                <Trash2 className="w-4 h-4" />
                Verwijderen
                </button>
            )}
          </div>
          <div className="flex gap-4">
            <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition"
            >
                Annuleren
            </button>
            <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium transition shadow-sm flex items-center gap-2"
            >
                {isSaving ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Opslaan & Syncen...
                    </>
                ) : (
                    <>
                        {session ? 'Wijzigingen Opslaan' : (recurrence.enabled ? `Alle ${recurrence.count} Sessies Maken` : 'Sessie Aanmaken')}
                        <CalendarIcon className="w-4 h-4" />
                    </>
                )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SessionEditor;