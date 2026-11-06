import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Minimize2, 
  Maximize2, 
  Power, 
  RotateCcw, 
  GripHorizontal,
  Wifi,
  Battery,
  Sparkles,
  Volume2,
  VolumeX,
  Layers
} from 'lucide-react';
import { DiceFace } from './DiceFace';
import { DiceRollItem, PhoneBackground } from '../types';
import { sound } from '../utils/sound';

interface PhoneSimulatorProps {
  rolls: DiceRollItem[];
  onAddRoll: (value: number, source: 'player' | 'opponent') => void;
  onResetRolls: () => void;
  selectedDice: number;
  onSelectDice: (val: number) => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  rolls,
  onAddRoll,
  onResetRolls,
  selectedDice,
  onSelectDice,
}) => {
  // Floating overlay state
  const [isOverlayActive, setIsOverlayActive] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 42, y: 110 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Rolling animation state
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rollingValue, setRollingValue] = useState<number>(6);
  const [rollingSource, setRollingSource] = useState<'player' | 'opponent'>('player');

  // Simulator settings
  const [bgType, setBgType] = useState<PhoneBackground>('ludo-board');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoMinimize, setAutoMinimize] = useState<boolean>(false);

  const phoneRef = useRef<HTMLDivElement>(null);

  // Time in status bar
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!phoneRef.current) return;
    const phoneRect = phoneRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - phoneRect.left - position.x,
      y: e.clientY - phoneRect.top - position.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !phoneRef.current) return;
    const phoneRect = phoneRef.current.getBoundingClientRect();
    
    // Bounds calculations
    const maxX = isExpanded ? phoneRect.width - 290 : phoneRect.width - 110;
    const maxY = isExpanded ? phoneRect.height - 350 : phoneRect.height - 80;

    let newX = e.clientX - phoneRect.left - dragOffset.x;
    let newY = e.clientY - phoneRect.top - dragOffset.y;

    newX = Math.max(10, Math.min(newX, maxX));
    newY = Math.max(45, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Trigger simulated roll with animation & audio
  const triggerRoll = useCallback(
    (val: number, source: 'player' | 'opponent') => {
      if (isRolling) return;
      setIsRolling(true);
      setRollingSource(source);
      sound.playDiceRoll();

      // Cycle numbers rapidly for 360ms to simulate physical dice tumble
      let cycleCount = 0;
      const interval = setInterval(() => {
        setRollingValue(Math.floor(Math.random() * 6) + 1);
        cycleCount++;
        if (cycleCount > 6) {
          clearInterval(interval);
          setRollingValue(val);
          setIsRolling(false);
          onAddRoll(val, source);

          if (val === 6) {
            sound.playSixChime();
          }

          if (autoMinimize && isExpanded) {
            setTimeout(() => setIsExpanded(false), 300);
          }
        }
      }, 50);
    },
    [isRolling, onAddRoll, autoMinimize, isExpanded]
  );

  const handlePlayerRoll = () => {
    triggerRoll(selectedDice, 'player');
  };

  const handleOpponentRoll = () => {
    const randomVal = Math.floor(Math.random() * 6) + 1;
    triggerRoll(randomVal, 'opponent');
  };

  // Stats calculation
  const totalCount = rolls.length;
  const sixCount = rolls.filter((r) => r.value === 6).length;
  const sixRate = totalCount > 0 ? Math.round((sixCount / totalCount) * 100) : 0;
  const lastRoll = rolls[rolls.length - 1] ?? null;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Top simulator toolbar */}
      <div className="w-full max-w-md flex items-center justify-between px-2 py-2 mb-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Background:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setBgType('ludo-board')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                bgType === 'ludo-board' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ludo Match
            </button>
            <button
              onClick={() => setBgType('home-screen')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                bgType === 'home-screen' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Android Home
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button
            onClick={() => setAutoMinimize(!autoMinimize)}
            title="Auto-minimize overlay on roll"
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
              autoMinimize
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Auto-Min
          </button>
          {!isOverlayActive && (
            <button
              onClick={() => setIsOverlayActive(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
            >
              Launch HUD
            </button>
          )}
        </div>
      </div>

      {/* Realistic Smartphone Chassis */}
      <div className="relative p-2.5 rounded-[44px] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl border-2 border-slate-600/70 w-[360px] sm:w-[380px] h-[720px] select-none">
        {/* Outer Phone Bezel & Screen Container */}
        <div 
          ref={phoneRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full h-full bg-slate-950 rounded-[38px] overflow-hidden border border-slate-800 shadow-inner"
        >
          {/* Top Speaker Ear-piece */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-800 rounded-full z-40" />

          {/* Android Status Bar */}
          <div className="relative z-30 flex items-center justify-between px-6 pt-2.5 pb-1 text-slate-200 text-xs font-medium">
            <span className="font-mono tracking-tight">{currentTime}</span>
            {/* Front Camera Punch-hole */}
            <div className="w-3.5 h-3.5 bg-black rounded-full border border-slate-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Wifi className="w-3 h-3" />
              <span className="text-[10px] font-bold font-mono">5G</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* BACKGROUND SCREEN: Ludo Board OR Android Home */}
          {bgType === 'ludo-board' ? (
            <div className="absolute inset-0 pt-8 pb-10 flex flex-col justify-between overflow-hidden">
              {/* Game Match Top Bar */}
              <div className="px-4 py-2 bg-gradient-to-r from-red-950/70 via-slate-900/90 to-emerald-950/70 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center text-xs font-bold text-white shadow">
                    P1
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">You (Green)</div>
                    <div className="text-[10px] text-emerald-400">Your Turn • Roll to move</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400">TABLE #408</div>
                  <div className="text-xs font-semibold text-amber-400">CLASSIC LUDO</div>
                </div>
              </div>

              {/* Graphical Ludo Board */}
              <div className="px-4 flex items-center justify-center my-auto">
                <div className="w-[316px] h-[316px] bg-slate-900 border-2 border-slate-700/80 rounded-xl grid grid-cols-15 grid-rows-15 p-1 relative shadow-xl">
                  {/* Top-Left Quadrant: RED HOME */}
                  <div className="absolute top-2 left-2 w-[120px] h-[120px] bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-2.5 flex flex-col justify-between border border-red-400/50 shadow">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-red-600" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-red-600" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-red-600" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-red-600" />
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Quadrant: GREEN HOME (Player) */}
                  <div className="absolute top-2 right-2 w-[120px] h-[120px] bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg p-2.5 flex flex-col justify-between border border-emerald-400/50 shadow">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-emerald-600 animate-pulse" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-emerald-600" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-emerald-600" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-emerald-600" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom-Left Quadrant: BLUE HOME */}
                  <div className="absolute bottom-2 left-2 w-[120px] h-[120px] bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-2.5 flex flex-col justify-between border border-blue-400/50 shadow">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-blue-600" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-blue-600" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-blue-600" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom-Right Quadrant: YELLOW HOME */}
                  <div className="absolute bottom-2 right-2 w-[120px] h-[120px] bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg p-2.5 flex flex-col justify-between border border-amber-300/50 shadow">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-amber-500" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-amber-500" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-amber-500" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-amber-500" />
                      </div>
                    </div>
                  </div>

                  {/* Center Triangle Finish Zone */}
                  <div className="absolute inset-0 m-auto w-16 h-16 bg-slate-950 border border-slate-700 flex items-center justify-center">
                    <div className="text-[10px] font-bold text-amber-300 flex flex-col items-center">
                      <span>★</span>
                      <span>HOME</span>
                    </div>
                  </div>

                  {/* Cross paths with safe stars */}
                  <div className="absolute top-[125px] left-3 flex gap-1 items-center">
                    <div className="w-5 h-5 bg-red-500/40 rounded flex items-center justify-center text-[8px] text-white">★</div>
                    <div className="w-5 h-5 bg-slate-800 rounded border border-slate-700" />
                    <div className="w-5 h-5 bg-slate-800 rounded border border-slate-700" />
                  </div>
                  <div className="absolute top-[125px] right-3 flex gap-1 items-center">
                    <div className="w-5 h-5 bg-slate-800 rounded border border-slate-700" />
                    <div className="w-5 h-5 bg-slate-800 rounded border border-slate-700" />
                    <div className="w-5 h-5 bg-emerald-500/40 rounded flex items-center justify-center text-[8px] text-white">★</div>
                  </div>
                </div>
              </div>

              {/* Game Match Bottom Bar */}
              <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-sm font-bold text-emerald-400">
                    🎲
                  </div>
                  <div className="text-xs text-slate-300">
                    Game Dice Ready
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Online Multiplayer Demo
                </div>
              </div>
            </div>
          ) : (
            /* Android Home Launcher Screen */
            <div className="absolute inset-0 pt-10 px-4 flex flex-col justify-between pb-8 bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-950">
              <div className="pt-6">
                <div className="text-3xl font-light text-white font-mono">{currentTime}</div>
                <div className="text-xs text-indigo-300 mt-1">Thursday, Nov 6</div>
                <div className="mt-4 p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-xs text-slate-300 flex items-center justify-between">
                  <span>Google Search...</span>
                  <span>🎙️</span>
                </div>
              </div>

              {/* Grid of app icons */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow">
                    🎲
                  </div>
                  <span className="text-[10px] text-slate-300">Ludo</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-xl shadow">
                    📱
                  </div>
                  <span className="text-[10px] text-slate-300">Messages</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-xl shadow">
                    ⚙️
                  </div>
                  <span className="text-[10px] text-slate-300">Settings</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-xl shadow">
                    🎮
                  </div>
                  <span className="text-[10px] text-slate-300">Games</span>
                </div>
              </div>
            </div>
          )}

          {/* TUMBLING ROLL ANIMATION OVERLAY (Appears during dice roll) */}
          {isRolling && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
              <div className="flex flex-col items-center animate-bounce">
                <div className="p-3 rounded-3xl bg-slate-900 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                  <DiceFace
                    value={rollingValue}
                    size="xl"
                    variant={rollingSource === 'player' ? 'gold' : 'cyan'}
                    isSelected={true}
                  />
                </div>
                <div className="mt-2 text-xs font-bold tracking-wider text-amber-300 uppercase drop-shadow">
                  {rollingSource === 'player' ? 'Simulating Player Roll...' : 'Opponent Rolling...'}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* THE NATIVE FLOATING COMPANION OVERLAY (SYSTEM_ALERT_WINDOW HUD) */}
          {/* ============================================================== */}
          {isOverlayActive && (
            <div
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              }}
              className="absolute top-0 left-0 z-40 transition-[box-shadow] duration-150 touch-none"
            >
              {!isExpanded ? (
                /* COLLAPSED HUD PILL */
                <div
                  onPointerDown={handlePointerDown}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/95 border-2 border-amber-500/80 shadow-[0_4px_20px_rgba(0,0,0,0.7)] backdrop-blur-md cursor-grab active:cursor-grabbing hover:border-amber-400 transition-all select-none group"
                >
                  <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                  <span className="text-sm">🎲</span>
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xs font-bold text-amber-300">
                    {lastRoll ? lastRoll.value : selectedDice}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      setIsExpanded(true);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Expand Companion Overlay"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* EXPANDED DARK PREMIUM GAMING HUD */
                <div className="w-[275px] sm:w-[280px] bg-slate-950/95 border-2 border-amber-500/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden text-slate-100 select-none">
                  {/* Draggable Header Bar */}
                  <div
                    onPointerDown={handlePointerDown}
                    className="px-3 py-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="w-4 h-0.5 bg-slate-500 rounded-full" />
                        <div className="w-4 h-0.5 bg-slate-500 rounded-full" />
                      </div>
                      <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Ludo Companion
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          setIsExpanded(false);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                        title="Minimize"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          setIsOverlayActive(false);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Close Service"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 space-y-2.5">
                    {/* Status Readout Banner */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[11px] text-slate-400">Target Roll:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-400">
                          {selectedDice}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
                      </div>
                    </div>

                    {/* 6 DICE SELECTOR BUTTONS (1–6) */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Select Dice Number
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          const isSelected = selectedDice === num;
                          return (
                            <button
                              key={num}
                              onClick={() => {
                                sound.playClick(300 + num * 60);
                                onSelectDice(num);
                              }}
                              className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
                                isSelected
                                  ? 'bg-amber-950/70 border-2 border-amber-400 text-amber-300 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                              }`}
                            >
                              <DiceFace value={num} size="sm" isSelected={isSelected} />
                              <span className="text-[11px] font-mono font-bold mt-1">
                                {num}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SIMULATE ROLL BUTTONS */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* Player Roll (Uses Selected Number) */}
                      <button
                        onClick={handlePlayerRoll}
                        disabled={isRolling}
                        className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-950/50 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <span>Roll #{selectedDice}</span>
                      </button>

                      {/* Opponent Random Simulator */}
                      <button
                        onClick={handleOpponentRoll}
                        disabled={isRolling}
                        className="w-full py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 active:scale-95 text-slate-200 hover:text-cyan-300 font-semibold text-xs tracking-wide shadow flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <span className="text-cyan-400">🎲</span>
                        <span>Opponent RNG</span>
                      </button>
                    </div>

                    {/* COMPANION STATS TRAY */}
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Rolls: <strong className="text-white font-mono">{totalCount}</strong></span>
                        <span>6s: <strong className="text-amber-400 font-mono">{sixCount} ({sixRate}%)</strong></span>
                        <button
                          onClick={() => {
                            sound.playClick(220);
                            onResetRolls();
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                          title="Reset history"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>

                      {lastRoll && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                          <span>
                            Last: <strong className={lastRoll.source === 'player' ? 'text-amber-300' : 'text-cyan-300'}>
                              {lastRoll.source === 'player' ? 'Player' : 'Opponent'}
                            </strong> rolled <strong className="text-white">{lastRoll.value}</strong>
                          </span>
                          <span className="font-mono text-slate-400">
                            {new Date(lastRoll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Android Bottom Gesture Bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-40" />
        </div>
      </div>

      {/* Simulator helper tips */}
      <div className="mt-3 text-center text-xs text-slate-400">
        💡 Drag the top bar of the overlay to move it anywhere on the phone screen.
      </div>
    </div>
  );
};
