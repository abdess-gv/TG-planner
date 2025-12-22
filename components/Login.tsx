import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDatabase';
import { User, Role } from '../types';
import { Lock, LogIn, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');

  useEffect(() => {
    const settings = db.getSettings();
    if (settings.googleClientId) {
      setGoogleClientId(settings.googleClientId);
      
      // Load Google Button
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initializeGoogleLogin(settings.googleClientId!);
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, []);

  const initializeGoogleLogin = (clientId: string) => {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback
    });
    
    window.google.accounts.id.renderButton(
      document.getElementById("googleSignInDiv"),
      { theme: "outline", size: "large", width: "100%", text: "continue_with" }
    );
  };

  const handleGoogleCallback = (response: any) => {
    try {
        // Decode JWT (Simple base64 decode for frontend)
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const email = payload.email;
        const name = payload.name;
        const picture = payload.picture;

        // Check if user exists in DB
        const users = db.getUsers();
        let existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (existingUser) {
            // Update photo if new
            if (!existingUser.picture && picture) {
                existingUser.picture = picture;
                db.saveUser(existingUser);
            }
            onLogin(existingUser);
        } else {
            // If user doesn't exist, we can create a Guest/Teacher account, or deny.
            // For this app, let's auto-create a TEACHER account so they can view/edit basic stuff,
            // but reserve ADMIN for known PINs or manually promoted users.
            const newUser: User = {
                id: crypto.randomUUID(),
                name: name,
                email: email,
                pin: '0000', // Dummy pin
                role: Role.TEACHER,
                picture: picture
            };
            db.saveUser(newUser);
            onLogin(newUser);
        }

    } catch (e) {
        console.error("Login failed", e);
        setError("Fout bij inloggen met Google.");
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = db.getUsers();
    const user = users.find(u => u.pin === pin);

    if (user) {
      onLogin(user);
    } else {
      setError('Ongeldige PIN code');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Lock className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Beheerder Toegang</h2>
        <p className="text-center text-slate-500 mb-6">Log in om de agenda te beheren</p>
        
        {/* Google Login Section */}
        {googleClientId ? (
            <div className="mb-6">
                 <div id="googleSignInDiv" className="w-full flex justify-center"></div>
            </div>
        ) : (
             <div className="mb-6 bg-yellow-50 p-3 rounded-lg flex items-start gap-2 text-yellow-800 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Google Login is niet geconfigureerd. Log in met PIN en stel de Client ID in bij instellingen.</p>
             </div>
        )}

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Of gebruik PIN</span>
            </div>
        </div>
        
        {/* PIN Login fallback */}
        <form onSubmit={handlePinSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              PIN Code
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
              placeholder="••••"
              maxLength={4}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Inloggen met PIN
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;