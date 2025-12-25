import React, { useState } from 'react';
import { Program } from '../types';
import { Copy, Check, CalendarRange, Eye } from 'lucide-react';

const EmbedGenerator: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState<Program | 'ALL'>('ALL');
  const [monthsLimit, setMonthsLimit] = useState<number>(3);
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.href.split('#')[0];
  // Construct URL with parameters using #/embed format which is more robust for hash routers
  const embedUrl = `${baseUrl}#/embed?program=${selectedProgram === 'ALL' ? 'all' : encodeURIComponent(selectedProgram)}&limit=${monthsLimit}`;
  
  const iframeCode = `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="700" 
  style="border:none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background-color: #f8fafc;"
  title="Activiteiten Agenda"
  allow="clipboard-write"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Eye className="w-6 h-6" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-slate-800">Studenten Embed Generator</h2>
            <p className="text-slate-600">
                Configureer hieronder hoe de agenda eruitziet voor studenten. Deze weergave vereist <span className="font-bold text-slate-800">geen login</span> en staat directe inschrijving toe.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Column */}
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">1. Filter Programma</h3>
                <div className="space-y-2">
                    <label className="flex items-center p-2 rounded hover:bg-slate-100 cursor-pointer transition">
                    <input 
                        type="radio" 
                        name="program" 
                        checked={selectedProgram === 'ALL'} 
                        onChange={() => setSelectedProgram('ALL')}
                        className="mr-3 text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-sm font-medium text-slate-700">Alles Tonen</span>
                    </label>
                    {Object.values(Program).map(p => (
                    <label key={p} className="flex items-center p-2 rounded hover:bg-slate-100 cursor-pointer transition">
                        <input 
                        type="radio" 
                        name="program" 
                        checked={selectedProgram === p} 
                        onChange={() => setSelectedProgram(p)}
                        className="mr-3 text-primary focus:ring-primary w-4 h-4"
                        />
                        <span className="text-sm font-medium text-slate-700">{p}</span>
                    </label>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <CalendarRange className="w-4 h-4" />
                    2. Periode Instelling
                </h3>
                <label className="block text-sm text-slate-600 mb-2">
                    Toon activiteiten tot: <span className="font-bold text-primary">{monthsLimit} maanden</span> vooruit.
                </label>
                <input 
                    type="range" 
                    min="1" 
                    max="12" 
                    value={monthsLimit} 
                    onChange={(e) => setMonthsLimit(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>1 maand</span>
                    <span>12 maanden</span>
                </div>
            </div>
        </div>

        {/* Output Column */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">3. Kopieer Embed Code</label>
          <div className="relative group">
            <textarea 
              readOnly
              value={iframeCode}
              rows={8}
              className="w-full px-4 py-3 bg-slate-900 text-slate-300 font-mono text-sm rounded-lg mb-2 focus:ring-2 focus:ring-primary outline-none"
            />
            <button 
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-primary rounded text-white transition shadow-lg"
              title="Kopieer code"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Plak deze HTML-code op uw studentenportaal, Wordpress site of Sharepoint pagina.
          </p>
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Live Voorbeeld</h3>
        <div className="border border-slate-200 rounded-xl overflow-hidden h-[500px] bg-slate-50 shadow-inner">
            {/* Added key prop to force re-render when URL changes */}
            <iframe 
                key={embedUrl}
                src={embedUrl} 
                className="w-full h-full" 
                title="Preview" 
            />
        </div>
      </div>
    </div>
  );
};

export default EmbedGenerator;