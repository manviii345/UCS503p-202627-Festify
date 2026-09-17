import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {showPrompt && !installed && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-6 right-6 z-50 max-w-md bg-[#efe3c8] text-[#152b38] p-5 rounded border-2 border-[#152b38] shadow-[6px_6px_0px_#c23b32]"
        >
          {/* Stamp perforation accent border */}
          <div className="absolute inset-1 border border-dashed border-[#152b38]/30 pointer-events-none" />

          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 bg-[#c23b32] text-[#efe3c8] rounded flex items-center justify-center font-alfa text-xl shrink-0 border border-[#152b38] shadow-[2px_2px_0px_#152b38]">
              ✉
            </div>

            <div className="flex-1">
              <div className="font-typewriter text-[10px] font-bold tracking-widest uppercase text-[#c23b32]">
                OFFICIAL PWA DISPATCH
              </div>
              <h4 className="font-fraunces font-black text-base text-[#152b38] leading-snug">
                Install Festify App for Offline Access
              </h4>
              <p className="font-fraunces text-xs text-[#152b38]/80 mt-1 leading-relaxed">
                Add to your home screen to view your QR gate tickets, offline schedules, and event maps anywhere without cellular network.
              </p>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 bg-[#152b38] text-[#efe3c8] font-alfa text-xs rounded border border-[#152b38] shadow-[3px_3px_0px_#e8a63b] hover:bg-[#c23b32] transition-colors"
                >
                  INSTALL PWA PASS ➔
                </button>

                <button
                  onClick={() => setShowPrompt(false)}
                  className="px-3 py-2 font-typewriter text-xs text-[#152b38]/70 hover:text-[#152b38] uppercase font-bold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
