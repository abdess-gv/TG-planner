import React from 'react';
import { Session, Subscriber } from '../types';
import { X, Download, User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface AttendeeListModalProps {
  session: Session;
  onClose: () => void;
}

const AttendeeListModal: React.FC<AttendeeListModalProps> = ({ session, onClose }) => {
  const subscribers = session.subscribers || [];

  const handleExport = () => {
    // Simple CSV export simulation
    const headers = "Naam,Email,Ingeschreven Op\n";
    const rows = subscribers.map(s => `${s.name},${s.email},${s.subscribedAt}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `deelnemers_${session.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Deelnemerslijst</h3>
            <p className="text-sm text-slate-500">{session.title} ({subscribers.length} aanmeldingen)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            {subscribers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nog geen inschrijvingen voor deze sessie.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Naam</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Datum Inschrijving</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {subscribers.map((sub, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                            {sub.name.charAt(0).toUpperCase()}
                                        </div>
                                        {sub.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <a href={`mailto:${sub.email}`} className="flex items-center gap-1 hover:text-primary hover:underline">
                                            <Mail className="w-3 h-3" /> {sub.email}
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">
                                        {format(new Date(sub.subscribedAt), 'dd MMM HH:mm', { locale: nl })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
            <button 
                onClick={handleExport}
                disabled={subscribers.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm text-sm font-medium"
            >
                <Download className="w-4 h-4" />
                Exporteer CSV
            </button>
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-sm text-sm font-medium"
            >
                Sluiten
            </button>
        </div>
      </div>
    </div>
  );
};

export default AttendeeListModal;
