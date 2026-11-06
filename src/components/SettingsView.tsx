import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Sparkles, 
  Trash2, 
  ShieldCheck, 
  Download,
  Upload,
  AlertTriangle,
  Layers,
  Check,
  Smartphone,
  FileText
} from 'lucide-react';
import { AppSettings } from '../types';
import { sound } from '../utils/sound';
import { storage } from '../utils/storage';
import { usePWAInstall } from '../utils/usePWAInstall';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetAllData: () => void;
  onReloadFromStorage: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
  onReloadFromStorage,
}) => {
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Backup Import State
  const [importPendingData, setImportPendingData] = useState<any | null>(null);
  const [importStats, setImportStats] = useState<{ playersCount: number; pastSessionsCount: number; rollsCount: number } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const showNotification = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    sound.setEnabled(next);
    if (next) sound.playClick();
    onUpdateSettings({ ...settings, soundEnabled: next });
  };

  const toggleHaptic = () => {
    const next = !settings.hapticEnabled;
    if (next && typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40]);
    }
    onUpdateSettings({ ...settings, hapticEnabled: next });
  };

  const toggleAnimations = () => {
    onUpdateSettings({ ...settings, animationsEnabled: !settings.animationsEnabled });
  };

  const toggleFloatingWidget = () => {
    onUpdateSettings({ ...settings, showFloatingWidget: !settings.showFloatingWidget });
  };

  const handleConfirmReset = () => {
    onResetAllData();
    setResetModalOpen(false);
    showNotification('All local data and match history have been reset.', 'success');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const jsonStr = storage.exportBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ludo-companion-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Backup exported successfully!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('Failed to generate backup file.', 'error');
    }
  };

  // Select Backup File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = storage.validateBackup(parsed);

        if (!validation.valid) {
          showNotification(validation.error || 'Invalid backup file structure.', 'error');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Valid backup ready for confirmation
        setImportPendingData(parsed);
        setImportStats(validation.stats || null);
        setImportModalOpen(true);
      } catch (err) {
        showNotification('Corrupted or invalid JSON file.', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!importPendingData) return;
    try {
      storage.importBackup(importPendingData);
      onReloadFromStorage();
      setImportModalOpen(false);
      setImportPendingData(null);
      setImportStats(null);
      showNotification('Backup restored successfully into LocalStorage!', 'success');
    } catch (err) {
      showNotification('Error writing backup data to storage.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          <span>Application Settings &amp; Preferences</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize audio, tactile haptics, animations, floating HUD, and offline data backup
        </p>
      </div>

      {statusMessage && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2 animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* PWA App Status Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-0.5 shadow flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Progressive Web App (PWA)</h3>
              <p className="text-xs text-slate-400">
                {isInstalled
                  ? 'Running in standalone native display mode'
                  : 'Installable on Android Chrome, Windows, Mac, and iOS'}
              </p>
            </div>
          </div>

          <div>
            {isInstalled ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Installed</span>
              </span>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Install App
              </button>
            ) : isIOS ? (
              <span className="text-xs text-purple-300 font-medium">Use Safari Share &rarr; Add to Home</span>
            ) : (
              <span className="text-xs text-slate-500 font-mono">PWA Active</span>
            )}
          </div>
        </div>
      </div>

      {/* Preferences Toggles Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950 divide-y divide-indigo-950/80">
        {/* Sound Toggle */}
        <div className="py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Audio &amp; Sound Effects</h3>
              <p className="text-xs text-slate-400">
                Play synthesized dice rattle and celebratory chime on rolling 6
              </p>
            </div>
          </div>

          <button
            onClick={toggleSound}
            aria-label="Toggle sound effects"
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
              settings.soundEnabled ? 'bg-purple-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Haptic Feedback Toggle */}
        <div className="py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Vibrate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tactile Haptic Feedback</h3>
              <p className="text-xs text-slate-400">
                Vibrate physical device hardware on dice rolls and button presses
              </p>
            </div>
          </div>

          <button
            onClick={toggleHaptic}
            aria-label="Toggle haptic vibration"
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              settings.hapticEnabled ? 'bg-cyan-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.hapticEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Animations Toggle */}
        <div className="py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Dice 3D Tumbling Animations</h3>
              <p className="text-xs text-slate-400">
                Smooth tumbling rotation and physics bounce during rolls
              </p>
            </div>
          </div>

          <button
            onClick={toggleAnimations}
            aria-label="Toggle dice animations"
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
              settings.animationsEnabled ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.animationsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* In-Page Floating HUD Widget Toggle */}
        <div className="py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">In-Page Floating HUD Companion</h3>
              <p className="text-xs text-slate-400">
                Show draggable in-page floating widget for quick rolls across all tabs
              </p>
            </div>
          </div>

          <button
            onClick={toggleFloatingWidget}
            aria-label="Toggle floating companion widget"
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
              settings.showFloatingWidget ? 'bg-emerald-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.showFloatingWidget ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Local Data Protection: Export & Import Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Local Data Protection &amp; Backup</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            All your game sessions, player rosters, and dice roll archives remain strictly private on this device. You can export a secure JSON backup file or restore your data anytime with zero server dependencies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/50 text-xs font-bold text-purple-200 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
          >
            <Download className="w-4 h-4 text-purple-300" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/50 text-xs font-bold text-indigo-200 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
          >
            <Upload className="w-4 h-4 text-indigo-300" />
            <span>Import Backup (JSON)</span>
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="pt-2 border-t border-indigo-950/80">
          <button
            onClick={() => setResetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-xs font-bold text-red-300 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Local Data &amp; History</span>
          </button>
        </div>
      </div>

      {/* CONFIRM IMPORT MODAL */}
      {importModalOpen && importStats && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#12182F] border-2 border-indigo-500/60 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Upload className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Restore Backup Data?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              A valid backup has been parsed. Restoring it will replace your current local players, matches, and roll records:
            </p>

            <div className="p-3.5 rounded-2xl bg-[#0B1020] border border-indigo-950 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Players in backup:</span>
                <strong className="text-white font-mono">{importStats.playersCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Past Matches:</span>
                <strong className="text-white font-mono">{importStats.pastSessionsCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rolls in history:</span>
                <strong className="text-white font-mono">{importStats.rollsCount}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Warning: Current unsaved changes will be overwritten with the backup data.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-lg active:scale-95 transition-all"
              >
                Confirm &amp; Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET MODAL */}
      {resetModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#12182F] border-2 border-red-500/60 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Reset All Application Data?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently wipe all active and archived match sessions, roll history logs, custom player configurations, and reset your preferences to default.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg active:scale-95 transition-all"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Information & Fair Play Policy */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#12182F] via-[#16132D] to-[#12182F] border border-purple-500/30 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">LUDO COMPANION &middot; Fair Play &amp; Independence</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Ludo Companion is an independent companion tool designed for private tabletop board games, training, probability analysis, and casual play.
        </p>

        <p className="text-xs text-slate-400 leading-relaxed">
          <strong>Important Disclosure:</strong> This application functions strictly independently of Ludo King or any third-party gaming platform. It operates 100% locally on your browser and <strong>never manipulates, predicts, intercepts, or modifies dice outcomes</strong> in any live online multiplayer game.
        </p>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-indigo-950/80">
          <span>Version: 2.1.0 (PWA Standalone)</span>
          <span>Web Crypto Cryptographic RNG</span>
        </div>
      </div>
    </div>
  );
};
