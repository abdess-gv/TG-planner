import React, { useState, useEffect } from 'react';
import { Session, Program, Role, Speaker } from '../types';
import { db } from '../services/mockDatabase';
import { Calendar, MapPin, Users, Clock, Edit2, Trash2, Video, UserPlus, Mic, ShieldCheck, ClipboardList, Filter, Search } from 'lucide-react';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import SubscriptionModal from './SubscriptionModal';
import AttendeeListModal from './AttendeeListModal';

interface SessionListProps {
  sessions: Session[];
  onEdit?: (session: Session) => void;
  onDelete?: (id: string) => void;
  userRole?: Role; 
  filterProgram?: Program | 'ALL';
}

const SessionList: React.FC<SessionListProps> = ({ sessions, onEdit, onDelete, userRole, filterProgram = 'ALL' }) => {
  const [selectedProgram, setSelectedProgram] = useState<Program | 'ALL'>(filterProgram);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [subscribeSession, setSubscribeSession] = useState<Session | null>(null);
  const [viewAttendeesSession, setViewAttendeesSession] = useState<Session | null>(null);
  const [speakersMap, setSpeakersMap] = useState<Record<string, Speaker>>({});

  useEffect(() => {
    // Cache speakers for lookup
    const allSpeakers = db.getSpeakers();
    const map: Record<string, Speaker> = {};
    allSpeakers.forEach(sp => { map[sp.id] = sp; });
    setSpeakersMap(map);
  }, []);

  const filteredSessions = sessions.filter(session => {
    // Program Filter
    if (selectedProgram !== 'ALL' && session.program !== selectedProgram) return false;
    
    // Search Query Filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = session.title.toLowerCase().includes(query);
        const matchesDescription = session.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
    }
    
    // Date Range Filter
    if (dateRange.start || dateRange.end) {
        const sessionDate = parseISO(session.date);
        
        // If only start date is selected: show everything from that date
        if (dateRange.start && !dateRange.end) {
            if (sessionDate < startOfDay(parseISO(dateRange.start))) return false;
        }
        
        // If only end date is selected: show everything until that date
        if (!dateRange.start && dateRange.end) {
            if (sessionDate > endOfDay(parseISO(dateRange.end))) return false;
        }

        // If both are selected: inclusive range
        if (dateRange.start && dateRange.end) {
            if (!isWithinInterval(sessionDate, {
                start: startOfDay(parseISO(dateRange.start)),
                end: endOfDay(parseISO(dateRange.end))
            })) return false;
        }
    }

    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getProgramColor = (program: Program) => {
    switch (program) {
      case Program.AI_READY: return 'bg-purple-100 text-purple-800 border-purple-200';
      case Program.WORK_READY: return 'bg-blue-100 text-blue-800 border-blue-200';
      case Program.PATHWAYS: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Filters Panel */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Zoek op titel of beschrijving..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 pt-4">
                {/* Program Filter Buttons */}
                {filterProgram === 'ALL' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedProgram('ALL')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        selectedProgram === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Alles
                    </button>
                    {Object.values(Program).map(prog => (
                      <button
                        key={prog}
                        onClick={() => setSelectedProgram(prog)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          selectedProgram === prog ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {prog}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Date Filters */}
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 ml-auto w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600 mr-2">Datum:</span>
                    <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:border-primary bg-white"
                    />
                    <span className="text-xs text-slate-400">-</span>
                    <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:border-primary bg-white"
                    />
                    {(dateRange.start || dateRange.end) && (
                        <button 
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="ml-2 text-xs text-red-500 hover:underline"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map(session => (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col">
              {session.imageUrl && (
                <div className="h-48 w-full overflow-hidden relative">
                  <img src={session.imageUrl} alt={session.title} className="w-full h-full object-cover" />
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getProgramColor(session.program)}`}>
                    {session.program}
                  </div>
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                {!session.imageUrl && (
                   <div className="mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getProgramColor(session.program)}`}>
                      {session.program}
                      </span>
                   </div>
                )}
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{session.title}</h3>
                
                <div className="flex items-center text-slate-500 text-sm mb-4 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(session.date), 'dd MMM yyyy', { locale: nl })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {session.startTime} - {session.endTime}
                  </div>
                </div>

                <p className="text-slate-600 mb-6 line-clamp-3 text-sm flex-1">{session.description}</p>

                {/* Speakers Info */}
                {session.speakers && session.speakers.length > 0 && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Mic className="w-3 h-3" /> Sprekers
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {session.speakers.map(config => {
                                const sp = speakersMap[config.speakerId];
                                if (!sp) return null;
                                return (
                                    <div key={config.speakerId} className="flex items-center gap-2 text-sm text-slate-800 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                                        {sp.photoUrl ? (
                                            <img src={sp.photoUrl} className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">{sp.name.charAt(0)}</div>
                                        )}
                                        <div className="flex flex-col leading-tight">
                                            <span className="font-medium text-xs">{sp.name}</span>
                                            {config.isCoHost && (
                                                <span className="text-[10px] text-primary flex items-center gap-0.5">
                                                    <ShieldCheck className="w-3 h-3" /> Co-host
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="space-y-3 pt-4 border-t border-slate-100 mt-auto">
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="truncate">{session.location}</span>
                  </div>
                  {session.maxParticipants && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Users className="w-4 h-4 mr-2 text-slate-400" />
                      <span>{session.subscribers?.length || 0} / {session.maxParticipants} deelnemers</span>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {session.enableNativeSignup ? (
                         <button
                            onClick={() => setSubscribeSession(session)}
                            className="flex-1 bg-primary text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2"
                         >
                            <UserPlus className="w-4 h-4" />
                            Inschrijven
                         </button>
                    ) : session.applicationLink && (
                      <a 
                        href={session.applicationLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 bg-primary text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
                      >
                        Aanmelden (Extern)
                      </a>
                    )}

                    {(session.googleMeetLink || session.recordingLink) && (
                      <a 
                        href={session.googleMeetLink || session.recordingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                        title={session.recordingLink ? "Bekijk opname" : "Ga naar meeting"}
                      >
                        <Video className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Controls */}
              {userRole && (
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                     onClick={() => setViewAttendeesSession(session)}
                     className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition"
                     title="Bekijk deelnemers"
                  >
                     <ClipboardList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit?.(session)}
                    className="p-2 text-slate-600 hover:text-primary hover:bg-white rounded-lg transition"
                    title="Bewerken"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete?.(session.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-white rounded-lg transition"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredSessions.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              {searchQuery || dateRange.start || dateRange.end 
                ? "Geen sessies gevonden met deze filters." 
                : "Geen sessies beschikbaar."}
            </div>
          )}
        </div>
      </div>

      {subscribeSession && (
          <SubscriptionModal 
            session={subscribeSession} 
            onClose={() => setSubscribeSession(null)}
            onSuccess={() => {
                alert('Bedankt voor je inschrijving!');
            }}
          />
      )}

      {viewAttendeesSession && (
        <AttendeeListModal 
            session={viewAttendeesSession}
            onClose={() => setViewAttendeesSession(null)}
        />
      )}
    </>
  );
};

export default SessionList;