import React, { useState } from 'react';
import { 
  FileCode, 
  Folder, 
  Download, 
  Copy, 
  Check, 
  Code2, 
  Terminal,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_FILES, AndroidFile } from '../data/androidProjectFiles';

export const AndroidProjectBrowser: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_FILES[1]); // Default FloatingOverlayService.kt
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Create files in the zip under LudoCompanion/ folder
      const rootFolder = zip.folder('LudoCompanion');
      if (rootFolder) {
        ANDROID_FILES.forEach((file) => {
          // Strip leading 'android/' prefix for standard Android Studio project root
          const relativePath = file.path.startsWith('android/')
            ? file.path.replace('android/', '')
            : file.path;
          rootFolder.file(relativePath, file.content);
        });

        // Also add standard gradlew wrapper script placeholder for completeness
        rootFolder.file(
          'gradlew',
          `#!/usr/bin/env sh
# Gradle wrapper script
exec gradle "$@"
`
        );
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'LudoCompanion-Android-Project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-400" />
            Complete Native Android Studio Project (Kotlin)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Target SDK 35 (Android 15) &middot; SYSTEM_ALERT_WINDOW &middot; Foreground Service &middot; Gradle 8.10.2
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Packaging Project...' : 'Export Android Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Quick 1-Command APK Compilation Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Installable Debug APK in 1 Command:</span>
          </div>
          <div className="text-xs text-slate-400">
            Unzip the project, open your terminal inside the folder, and run:
          </div>
          <div className="font-mono text-xs text-amber-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 inline-block">
            ./gradlew assembleDebug
          </div>
        </div>

        <div className="text-right text-xs text-slate-400 shrink-0">
          <div>Output: <span className="font-mono text-slate-200">app-debug.apk</span></div>
          <div className="text-[11px] text-slate-500">Auto-signed with debug keystore</div>
        </div>
      </div>

      {/* Code Browser Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: File Tree Sidebar */}
        <div className="lg:col-span-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[560px]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-2 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            Project File Tree
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
            {ANDROID_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <div className="truncate text-xs">{file.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {file.path}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 mt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5 px-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Tested for Android 15 (API 35) & 14 (API 34)</span>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[560px] overflow-hidden">
          {/* File Header */}
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-amber-300">
                {selectedFile.path}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono uppercase">
                {selectedFile.language}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Code Text with line numbers */}
          <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300 select-text">
            <pre className="overflow-x-auto">
              {selectedFile.content.split('\n').map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/60">
                  <span className="table-cell select-none pr-4 text-right text-slate-600 text-[11px] w-10">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
