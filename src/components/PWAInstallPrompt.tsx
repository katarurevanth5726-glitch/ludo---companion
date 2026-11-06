import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Check, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone display mode, don't show the install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    await install();
    setIsInstalling(false);
  };

  return (
    <>
      {/* Chromium / Android install trigger button */}
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          aria-label="Install Ludo Companion app"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 active:scale-95 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
        </button>
      )}

      {/* iOS Safari manual Add to Home Screen button */}
      {isIOS && !isInstallable && (
        <button
          onClick={() => setShowIOSGuide(true)}
          aria-label="Install on iPhone / iPad"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12182F] hover:bg-slate-850 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install PWA</span>
        </button>
      )}

      {/* iOS Safari Installation Instruction Modal */}
      {showIOSGuide && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-sm p-6 rounded-3xl bg-[#12182F] border-2 border-purple-500/60 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <h3 id="ios-guide-title" className="text-base font-bold text-white">
                  Install on iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close installation guide"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1020] border border-indigo-950">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-semibold mb-0.5">1. Tap Safari Share</strong>
                  Tap the <span className="text-purple-300">Share</span> icon in the bottom Safari toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1020] border border-indigo-950">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-semibold mb-0.5">2. Add to Home Screen</strong>
                  Scroll down the share sheet and select <span className="text-purple-300 font-semibold">"Add to Home Screen"</span>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1020] border border-indigo-950">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block font-semibold mb-0.5">3. Launch Fullscreen</strong>
                  Open Ludo Companion directly from your home screen with zero browser bars!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
