import React, { useState } from 'react';
import { 
  Terminal, 
  ShieldCheck, 
  Copy, 
  Check, 
  Smartphone, 
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCommand = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: 'Step 1: Open Project in Android Studio',
      description: 'Launch Android Studio (Ladybug 2024.2+ or Koala). Click File > Open and select the android/ folder from this project.',
      command: null,
    },
    {
      title: 'Step 2: Compile Debug APK via Terminal',
      description: 'You can build directly using the bundled Gradle wrapper in your terminal:',
      command: 'cd android && ./gradlew assembleDebug',
    },
    {
      title: 'Step 3: Install onto Device / Emulator via ADB',
      description: 'Connect your Android 15 phone or start an Android 15 emulator with USB debugging enabled:',
      command: 'adb install -r app/build/outputs/apk/debug/app-debug.apk',
    },
    {
      title: 'Step 4: Grant SYSTEM_ALERT_WINDOW Permission',
      description: 'Either open the app and tap "Grant Overlay Permission", or grant it immediately using ADB shell:',
      command: 'adb shell appops set com.ludocompanion.overlay SYSTEM_ALERT_WINDOW allow\nadb shell pm grant com.ludocompanion.overlay android.permission.POST_NOTIFICATIONS',
    },
    {
      title: 'Step 5: Launch Companion Overlay',
      description: 'Open the Ludo Companion app on your device and tap "Launch Floating Overlay". The HUD will float on top of any game or screen!',
      command: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Privacy & Anti-Cheating Clear Policy Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              Privacy, Safety & Policy Compliance
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This application is an <strong>independent simulation companion and tactical probability assistant</strong>. 
              It runs 100% locally on your device without internet access, root privileges, or credential collection.
            </p>
            <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero network interception
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                No root access needed
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Android 15 Foreground Service policy compliant
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step by step build guide */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">How to Build & Run Debug APK</h3>
        </div>

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-amber-300">
                  {step.title}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {step.description}
              </p>
              {step.command && (
                <div className="relative mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs text-emerald-400">
                  <pre className="overflow-x-auto whitespace-pre-wrap">{step.command}</pre>
                  <button
                    onClick={() => copyCommand(step.command!, idx)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-2 shrink-0"
                    title="Copy command"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Android 15 Technical Details */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Android 15 (API 35) Architectural Notes</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Google introduced strict Foreground Service policy enforcements in Android 14 and Android 15. The companion architecture adheres strictly to these standards:
        </p>

        <ul className="space-y-2 text-xs text-slate-300 pl-4 list-disc">
          <li>
            <strong>Foreground Service Type:</strong> Configured with <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400">android:foregroundServiceType=&quot;specialUse&quot;</code> in <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-300">AndroidManifest.xml</code>.
          </li>
          <li>
            <strong>Subtype Declaration:</strong> Declares <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400">PROPERTY_SPECIAL_USE_FGS_SUBTYPE</code> detailing its utility as an independent floating dice simulation companion.
          </li>
          <li>
            <strong>Runtime Notification Permission:</strong> Complies with <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400">POST_NOTIFICATIONS</code> requested dynamically on Android 13+ devices.
          </li>
          <li>
            <strong>Window Overlay Type:</strong> Uses <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400">WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY</code> with non-focusable flags to ensure game touch events pass through seamlessly.
          </li>
        </ul>
      </div>
    </div>
  );
};
