import { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

export function OfflineOverlay({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center text-white font-mono selection:bg-white/20">
        <div className="max-w-md w-full px-6 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <WifiOff className="w-24 h-24 text-red-500/80 animate-pulse" />
            <div className="absolute -inset-4 bg-red-500/10 blur-xl rounded-full" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">
              Connection Lost
            </h1>
            <div className="h-px w-16 bg-red-500/50 mx-auto" />
            <p className="text-sm text-muted-foreground leading-relaxed uppercase tracking-widest">
              WIRRE cannot connect to the internet. 
              <br/><br/>
              Please check your connection. You'll continue from where you left off.
            </p>
          </div>
          
          <div className="flex items-center gap-2 pt-8 text-xs text-muted-foreground/50 uppercase tracking-widest font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Waiting for signal</span>
            <span className="flex gap-1 ml-1">
              <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-current rounded-full animate-bounce"></span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
