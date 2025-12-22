import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDatabase';
import { Speaker } from '../types';
import { User, Plus, Trash2, Edit2, Mail, Save, X } from 'lucide-react';

const SpeakerManager: React.FC = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<Partial<Speaker>>({});

  useEffect(() => {
    setSpeakers(db.getSpeakers());
  }, []);

  const handleEdit = (speaker?: Speaker) => {
    setCurrentSpeaker(speaker || { name: '', email: '', roleOrTitle: '', bio: '' });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Spreker verwijderen?')) {
      db.deleteSpeaker(id);
      setSpeakers(db.getSpeakers());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpeaker.name || !currentSpeaker.email) return;

    const speakerToSave: Speaker = {
      id: currentSpeaker.id || crypto.randomUUID(),
      name: currentSpeaker.name,
      email: currentSpeaker.email,
      roleOrTitle: currentSpeaker.roleOrTitle || '',
      bio: currentSpeaker.bio || '',
      photoUrl: currentSpeaker.photoUrl
    };

    db.saveSpeaker(speakerToSave);
    setSpeakers(db.getSpeakers());
    setIsEditing(false);
    setCurrentSpeaker({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sprekers Beheer</h2>
          <p className="text-slate-500 text-sm">Beheer de lijst van gastsprekers en docenten.</p>
        </div>
        <button
          onClick={() => handleEdit()}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Spreker Toevoegen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 grid gap-4">
          {speakers.map(speaker => (
            <div key={speaker.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {speaker.photoUrl ? (
                  <img src={speaker.photoUrl} alt={speaker.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{speaker.name}</h3>
                <p className="text-sm text-primary font-medium">{speaker.roleOrTitle}</p>
                <div className="flex items-center text-xs text-slate-500 mt-1 mb-2">
                  <Mail className="w-3 h-3 mr-1" />
                  {speaker.email}
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{speaker.bio}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleEdit(speaker)}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(speaker.id)}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {speakers.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              Nog geen sprekers toegevoegd.
            </div>
          )}
        </div>

        {/* Editor Panel (Floating or Static) */}
        {isEditing && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">{currentSpeaker.id ? 'Spreker Bewerken' : 'Nieuwe Spreker'}</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Naam *</label>
                <input
                  type="text"
                  value={currentSpeaker.name || ''}
                  onChange={e => setCurrentSpeaker({...currentSpeaker, name: e.target.value})}
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-primary outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={currentSpeaker.email || ''}
                  onChange={e => setCurrentSpeaker({...currentSpeaker, email: e.target.value})}
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-primary outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Functie / Titel</label>
                <input
                  type="text"
                  value={currentSpeaker.roleOrTitle || ''}
                  onChange={e => setCurrentSpeaker({...currentSpeaker, roleOrTitle: e.target.value})}
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={currentSpeaker.bio || ''}
                  onChange={e => setCurrentSpeaker({...currentSpeaker, bio: e.target.value})}
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Foto URL</label>
                <input
                  type="text"
                  value={currentSpeaker.photoUrl || ''}
                  onChange={e => setCurrentSpeaker({...currentSpeaker, photoUrl: e.target.value})}
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-primary outline-none text-sm"
                  placeholder="https://..."
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakerManager;
