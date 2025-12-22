import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDatabase';
import { User, AppSettings, Role } from '../types';
import { UserPlus, Trash2, Save, RefreshCw, Shield, AlertTriangle, Download, Upload, Server, Mail } from 'lucide-react';

const Settings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    googleCalendarId: '',
    googleClientId: '',
    googleApiKey: '',
    emailWebhookUrl: '',
    organizationName: '',
    enableEmailNotifications: true
  });
  
  const [newUser, setNewUser] = useState({ name: '', email: '', pin: '', role: Role.TEACHER });
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsers(db.getUsers());
    setSettings(db.getSettings());
  }, []);

  const handleSaveSettings = () => {
    db.saveSettings(settings);
    setMessage('Instellingen succesvol opgeslagen.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.pin) return;
    
    const user: User = {
      id: crypto.randomUUID(),
      ...newUser
    };
    
    db.saveUser(user);
    setUsers(db.getUsers());
    setNewUser({ name: '', email: '', pin: '', role: Role.TEACHER });
  };

  const handleDeleteUser = (id: string) => {
    try {
      db.deleteUser(id);
      setUsers(db.getUsers());
    } catch (e: any) {
      alert(e.message);
    }
  };

  // --- Backup Functions ---
  const handleExport = () => {
    const json = db.exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planner_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        if (db.importData(content)) {
            alert("Data succesvol geïmporteerd! De pagina wordt herladen.");
            window.location.reload();
        } else {
            alert("Fout bij importeren. Controleer of het bestand geldig is.");
        }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Integration Settings */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-primary" />
          Systeem Configuratie
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="col-span-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Organisatie Naam</label>
             <input
              type="text"
              value={settings.organizationName}
              onChange={(e) => setSettings({...settings, organizationName: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Mijn School / Bedrijf"
            />
          </div>

          {/* Google */}
          <div className="col-span-full border-t border-slate-100 pt-4 mt-2">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Google Workspace</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Google Calendar ID</label>
            <input
              type="text"
              value={settings.googleCalendarId}
              onChange={(e) => setSettings({...settings, googleCalendarId: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
              placeholder="organization@group.calendar.google.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Google Client ID (OAuth)</label>
            <input
              type="text"
              value={settings.googleClientId || ''}
              onChange={(e) => setSettings({...settings, googleClientId: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
              placeholder="...apps.googleusercontent.com"
            />
            <p className="text-xs text-slate-500 mt-1">Vereist voor Google Login functionaliteit.</p>
          </div>

          {/* Email / Webhooks */}
          <div className="col-span-full border-t border-slate-100 pt-4 mt-2">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email & Automatisering
             </h3>
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Webhook URL (Zapier / Make / n8n)
            </label>
            <input
              type="url"
              value={settings.emailWebhookUrl || ''}
              onChange={(e) => setSettings({...settings, emailWebhookUrl: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
            />
            <p className="text-xs text-slate-500 mt-1">
                Indien ingevuld, stuurt de app een POST request met JSON data naar deze URL voor emails (uitnodigingen/bevestigingen).
            </p>
          </div>
          <div className="flex items-center">
             <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input 
                    type="checkbox"
                    checked={settings.enableEmailNotifications}
                    onChange={(e) => setSettings({...settings, enableEmailNotifications: e.target.checked})}
                    className="rounded text-primary focus:ring-primary"
                />
                Activeer Email notificaties
             </label>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-sm font-medium"
           >
             <Save className="w-4 h-4" />
             Opslaan
           </button>
        </div>
        
        {message && <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
      </section>

      {/* 2. User Management */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Gebruikers Beheer
        </h2>

        <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-slate-50 p-4 rounded-lg">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-500 mb-1">Naam</label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-500 mb-1">Email (voor Google Login)</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-primary outline-none"
              placeholder="naam@organisatie.nl"
            />
          </div>
          <div className="w-full md:w-24">
            <label className="block text-xs font-medium text-slate-500 mb-1">PIN</label>
            <input
              type="text"
              maxLength={4}
              value={newUser.pin}
              onChange={(e) => setNewUser({...newUser, pin: e.target.value})}
              className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-primary outline-none text-center"
              placeholder="1234"
              required
            />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-xs font-medium text-slate-500 mb-1">Rol</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value as Role})}
              className="w-full px-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-primary outline-none"
            >
              <option value={Role.TEACHER}>Leraar</option>
              <option value={Role.ADMIN}>Beheerder</option>
            </select>
          </div>
          <button type="submit" className="w-full md:w-auto px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition text-sm font-medium">
            Toevoegen
          </button>
        </form>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Naam</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">PIN</th>
                <th className="px-6 py-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="bg-white border-b hover:bg-slate-50 last:border-0">
                  <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                    {user.picture && <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />}
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-xs">{user.email || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">••••</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 transition"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Data Backup */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Data Backup & Herstel
         </h2>
         <p className="text-sm text-slate-600 mb-6">
            Omdat deze applicatie in de browser draait, is het belangrijk om regelmatig een backup te maken van uw data.
         </p>
         
         <div className="flex gap-4">
             <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
             >
                <Download className="w-4 h-4" />
                Backup Downloaden (JSON)
             </button>
             
             <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
             >
                <Upload className="w-4 h-4" />
                Backup Herstellen
             </button>
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
             />
         </div>
      </section>
    </div>
  );
};

export default Settings;