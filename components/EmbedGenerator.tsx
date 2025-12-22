import React, { useState } from 'react';
import { Program } from '../types';
import { Copy, Check } from 'lucide-react';

const EmbedGenerator: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState<Program | 'ALL'>('ALL');
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.href.split('#')[0];
  const embedUrl = `${baseUrl}#embed?program=${selectedProgram === 'ALL' ? 'all' : encodeURIComponent(selectedProgram)}`;
  
  const iframeCode = `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="600" 
  style="border:none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"
  title="Activiteiten Agenda"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Embed Generator</h2>
      <p className="text-slate-600 mb-6">Genereer een code om de agenda op een andere website te tonen (bijv. voor studenten).</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Selecteer Programma Filter</label>
          <div className="space-y-2 mb-6">
            <label className="flex items-center p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
              <input 
                type="radio" 
                name="program" 
                checked={selectedProgram === 'ALL'} 
                onChange={() => setSelectedProgram('ALL')}
                className="mr-3 text-primary focus:ring-primary"
              />
              <span className="font-medium text-slate-700">Alles Tonen</span>
            </label>
            {Object.values(Program).map(p => (
              <label key={p} className="flex items-center p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                <input 
                  type="radio" 
                  name="program" 
                  checked={selectedProgram === p} 
                  onChange={() => setSelectedProgram(p)}
                  className="mr-3 text-primary focus:ring-primary"
                />
                <span className="font-medium text-slate-700">{p}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Embed Code</label>
          <div className="relative">
            <textarea 
              readOnly
              value={iframeCode}
              rows={6}
              className="w-full px-4 py-3 bg-slate-900 text-slate-300 font-mono text-sm rounded-lg mb-2"
            />
            <button 
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition"
              title="Kopieer code"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Kopieer deze code en plak het in de HTML van uw website.
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Voorbeeld Weergave</h3>
        <div className="border border-slate-200 rounded-xl overflow-hidden h-[400px] bg-slate-50">
            <iframe src={embedUrl.replace('#', '#/')} className="w-full h-full" title="Preview" />
        </div>
      </div>
    </div>
  );
};

export default EmbedGenerator;
