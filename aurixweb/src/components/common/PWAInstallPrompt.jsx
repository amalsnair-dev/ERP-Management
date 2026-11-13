import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      // Clear the deferredPrompt so it can be garbage collected
      setDeferredPrompt(null);
      setIsVisible(false);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setIsVisible(false);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-slate-900 dark:bg-slate-800 text-white p-3 pr-4 rounded-xl shadow-2xl border border-slate-700/50 animate-in slide-in-from-bottom-5">
      <div className="bg-sky-500/20 p-2 rounded-lg">
        <Download className="text-sky-400" size={24} />
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-sm">Install AURIX App</span>
        <span className="text-xs text-slate-400">Add to your device for easy access</span>
      </div>
      <button
        onClick={handleInstallClick}
        className="ml-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Install
      </button>
      <button 
        onClick={() => setIsVisible(false)}
        className="p-1 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors absolute -top-2 -right-2 bg-slate-800 border border-slate-700"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
