import React, { useState } from 'react';
import { Session } from '../types';
import { db } from '../services/mockDatabase';
import { emailService } from '../services/emailService';
import { X, Check, Mail, User } from 'lucide-react';

interface SubscriptionModalProps {
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ session, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS'>('IDLE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('SENDING');

    // 1. Save to DB
    db.addSubscriberToSession(session.id, {
      name,
      email,
      subscribedAt: new Date().toISOString()
    });

    // 2. Send Confirmation Email
    await emailService.sendStudentConfirmation(email, name, session);

    setStatus('SUCCESS');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Inschrijven voor Sessie</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-slate-50 p-4 rounded-lg">
             <h4 className="font-medium text-slate-800">{session.title}</h4>
             <p className="text-sm text-slate-500 mt-1">{session.date} • {session.startTime}</p>
          </div>

          {status === 'SUCCESS' ? (
             <div className="text-center py-8">
               <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Check className="w-8 h-8" />
               </div>
               <h4 className="text-xl font-bold text-slate-800 mb-2">Ingeschreven!</h4>
               <p className="text-slate-500">Je ontvangt zojuist een bevestiging per mail.</p>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Volledige Naam</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Jan Jansen"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Adres</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="student@school.nl"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'SENDING'}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {status === 'SENDING' ? 'Bezig met inschrijven...' : 'Bevestig Inschrijving'}
                </button>
                <p className="text-xs text-center text-slate-400 mt-4">
                  Door in te schrijven ga je akkoord dat we je updates sturen over deze sessie.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
