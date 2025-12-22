import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { db } from './services/mockDatabase';
import { User, Session, Role, Program } from './types';
import Login from './components/Login';
import SessionList from './components/SessionList';
import SessionEditor from './components/SessionEditor';
import Settings from './components/Settings';
import EmbedGenerator from './components/EmbedGenerator';
import SpeakerManager from './components/SpeakerManager';
import { Calendar, LayoutDashboard, Settings as SettingsIcon, LogOut, Code, User as UserIcon, Mic } from 'lucide-react';

// Hash Router simulation
const useHash = () => {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return hash;
};

const App: React.FC = () => {
  const hash = useHash();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [view, setView] = useState<'LIST' | 'EDITOR' | 'SETTINGS' | 'EMBED' | 'SPEAKERS'>('LIST');
  const [editingSession, setEditingSession] = useState<Session | undefined>(undefined);
  
  // Embed Mode Check
  const isEmbed = hash.startsWith('#embed');
  const embedParams = new URLSearchParams(hash.split('?')[1]);
  const embedProgram = embedParams.get('program');
  const filterProgram = embedProgram === 'all' ? 'ALL' : (embedProgram as Program) || 'ALL';

  useEffect(() => {
    setSessions(db.getSessions());
  }, [view]); // Refresh on view change

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('LIST');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('LIST');
  };

  const handleSaveSession = (sessionOrSessions: Session | Session[]) => {
    if (Array.isArray(sessionOrSessions)) {
      sessionOrSessions.forEach(s => db.saveSession(s));
    } else {
      db.saveSession(sessionOrSessions);
    }
    setSessions(db.getSessions());
    setView('LIST');
    setEditingSession(undefined);
  };

  const handleDeleteSession = (id: string) => {
    if (confirm('Weet u zeker dat u deze sessie wilt verwijderen?')) {
      db.deleteSession(id);
      setSessions(db.getSessions());
      return true;
    }
    return false;
  };

  const startEdit = (session?: Session) => {
    setEditingSession(session);
    setView('EDITOR');
  };

  // --- EMBED VIEW ---
  if (isEmbed) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 font-sans">
        <SessionList 
          sessions={sessions} 
          filterProgram={filterProgram as any}
        />
      </div>
    );
  }

  // --- AUTH FLOW ---
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // --- ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-white w-full md:w-64 border-r border-slate-200 flex-shrink-0">
        <div className="p-6 border-b border-slate-100">
           <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Calendar className="w-6 h-6 text-primary" />
             Planner Pro
           </h1>
           <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
               {currentUser.picture ? (
                 <img src={currentUser.picture} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-4 h-4" />
               )}
             </div>
             <div>
                <p className="font-medium text-slate-800">{currentUser.name}</p>
                <p className="text-xs">{currentUser.role === Role.ADMIN ? 'Beheerder' : 'Leraar'}</p>
             </div>
           </div>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setView('LIST')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              view === 'LIST' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Agenda Overzicht
          </button>

          {currentUser.role === Role.ADMIN && (
            <>
               <button 
                onClick={() => setView('SPEAKERS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  view === 'SPEAKERS' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Mic className="w-5 h-5" />
                Sprekers
              </button>

              <button 
                onClick={() => setView('EMBED')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  view === 'EMBED' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Code className="w-5 h-5" />
                Embed Generator
              </button>
              
              <button 
                onClick={() => setView('SETTINGS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  view === 'SETTINGS' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                Instellingen
              </button>
            </>
          )}

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 mt-8 transition"
          >
            <LogOut className="w-5 h-5" />
            Uitloggen
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {view === 'LIST' && 'Agenda Overzicht'}
              {view === 'EDITOR' && (editingSession ? 'Sessie Bewerken' : 'Nieuwe Sessie')}
              {view === 'SETTINGS' && 'Instellingen'}
              {view === 'EMBED' && 'Embed Generator'}
              {view === 'SPEAKERS' && 'Sprekers Beheer'}
            </h2>
            <p className="text-slate-500 mt-1">
              {view === 'LIST' && `Beheer uw activiteiten voor ${db.getSettings().organizationName}`}
            </p>
          </div>
          
          {view === 'LIST' && (
            <button 
              onClick={() => startEdit()}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
            >
              + Nieuwe Sessie
            </button>
          )}
        </header>

        {view === 'LIST' && (
          <SessionList 
            sessions={sessions} 
            onEdit={startEdit} 
            onDelete={handleDeleteSession}
            userRole={currentUser.role}
          />
        )}

        {view === 'EDITOR' && (
          <SessionEditor 
            session={editingSession}
            onSave={handleSaveSession}
            onCancel={() => setView('LIST')}
            onDelete={(id) => {
               if (handleDeleteSession(id)) {
                  setView('LIST');
               }
            }}
          />
        )}

        {view === 'SPEAKERS' && currentUser.role === Role.ADMIN && (
          <SpeakerManager />
        )}

        {view === 'SETTINGS' && currentUser.role === Role.ADMIN && (
          <Settings />
        )}

        {view === 'EMBED' && currentUser.role === Role.ADMIN && (
          <EmbedGenerator />
        )}
      </main>
    </div>
  );
};

export default App;