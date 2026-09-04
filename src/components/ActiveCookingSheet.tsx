import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  Clock,
  Sparkles,
  SunMedium,
  Sun,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ActiveCookingSheet: React.FC = () => {
  const {
    selectedRecipe,
    exitCookingMode,
    cookingStepIndex,
    setCookingStepIndex,
    cookingTimerSeconds,
    setCookingTimerSeconds,
    isTimerRunning,
    setIsTimerRunning,
    setToast,
    addCookingHistory,
  } = useAppStore();

  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  if (!selectedRecipe) return null;

  const totalSteps = selectedRecipe.instructions.length;
  const stepRaw = selectedRecipe.instructions[cookingStepIndex] || selectedRecipe.instructions[0];
  const stepText = typeof stepRaw === 'string' ? stepRaw : (stepRaw as any)?.text || '';
  const stepTitle = typeof stepRaw === 'object' && (stepRaw as any)?.title ? (stepRaw as any).title : `Step ${cookingStepIndex + 1}`;
  const stepTip = typeof stepRaw === 'object' && (stepRaw as any)?.tip ? (stepRaw as any).tip : (selectedRecipe.tips?.[cookingStepIndex] || selectedRecipe.chefTips?.[cookingStepIndex]);

  // Extract timing cue from step text if not provided directly
  const stepMinutesMatch = stepText.match(/(\d+)\s*(?:minutes|mins|min)/i);
  const detectedMinutes = stepMinutesMatch ? parseInt(stepMinutesMatch[1], 10) : ((stepRaw as any)?.timeMinutes || 5);
  const timingCue = stepMinutesMatch ? `Cook for ${detectedMinutes} minutes.` : `Estimated time: ${detectedMinutes} minutes.`;

  // Play audio chime using Web Audio API
  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First pleasant bell tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.8);

      // Second higher harmonic tone
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain2.gain.setValueAtTime(0.35, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 1.2);
      }, 200);
    } catch (e) {
      console.warn('Audio chime playback not supported:', e);
    }
  };

  // Screen Wake Lock setup
  useEffect(() => {
    let isMounted = true;

    async function requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (isMounted) {
            wakeLockRef.current = lock;
            setWakeLockActive(true);
            lock.addEventListener('release', () => {
              if (isMounted) setWakeLockActive(false);
            });
          }
        } catch (err) {
          console.warn('Screen Wake Lock request failed:', err);
          if (isMounted) setWakeLockActive(false);
        }
      }
    }

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  const toggleWakeLock = async () => {
    if (wakeLockActive && wakeLockRef.current) {
      await wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
      setWakeLockActive(false);
      setToast('Screen Wake Lock disabled');
    } else if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = lock;
        setWakeLockActive(true);
        setToast('Screen kept awake while cooking');
      } catch (e) {
        setToast('Wake Lock not available on this device');
      }
    }
  };

  // Timer countdown hook
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && cookingTimerSeconds > 0) {
      interval = setInterval(() => {
        setCookingTimerSeconds(cookingTimerSeconds - 1);
      }, 1000);
    } else if (cookingTimerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playChimeSound();
      setToast('🔔 Step timer completed! Bon appétit.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, cookingTimerSeconds, setCookingTimerSeconds, setIsTimerRunning, setToast]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const startStepTimer = (minutes: number) => {
    setCookingTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
    setToast(`Timer started: ${minutes} minutes`);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setCookingTimerSeconds(detectedMinutes * 60);
  };

  const addOneMinute = () => {
    setCookingTimerSeconds(cookingTimerSeconds + 60);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (cookingStepIndex < totalSteps - 1) {
      setCookingStepIndex(cookingStepIndex + 1);
      // Auto-set the timer for the next step duration if timer is not active
      const nextStep = selectedRecipe.instructions[cookingStepIndex + 1];
      const nextText = typeof nextStep === 'string' ? nextStep : (nextStep as any)?.text || '';
      const nextMatch = nextText.match(/(\d+)\s*(?:minutes|mins|min)/i);
      const nextMins = nextMatch ? parseInt(nextMatch[1], 10) : 5;
      if (!isTimerRunning) {
        setCookingTimerSeconds(nextMins * 60);
      }
    } else {
      playChimeSound();
      addCookingHistory(selectedRecipe, 5);
      setToast('🎉 Masterpiece completed! Logged in your cooking history!');
      exitCookingMode();
    }
  };

  const handlePrev = () => {
    if (cookingStepIndex > 0) {
      setCookingStepIndex(cookingStepIndex - 1);
    }
  };

  const progressPercent = Math.round(((cookingStepIndex + 1) / totalSteps) * 100);

  return (
    <div
      id="active-cooking-screen"
      className="fixed inset-0 z-50 bg-[#121212] text-white flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Top App Bar with Keep-Awake & Exit Controls */}
      <header className="px-5 pt-4 pb-3 border-b border-white/10 flex items-center justify-between bg-[#1A1A1A]/90 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#FF5A3C] flex items-center justify-center text-white font-bold text-sm shadow-md">
            {cookingStepIndex + 1}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold tracking-widest text-[#FF5A3C] uppercase block">
              Active Cooking Mode
            </span>
            <h2 className="text-sm font-bold text-white truncate">{selectedRecipe.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Keep Screen Awake Indicator & Toggle */}
          <button
            id="wake-lock-toggle-btn"
            onClick={toggleWakeLock}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              wakeLockActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-white/10 text-white/60 border-white/10 hover:bg-white/15'
            }`}
            title={wakeLockActive ? 'Screen will stay awake' : 'Click to keep screen awake'}
          >
            {wakeLockActive ? <SunMedium size={14} className="text-amber-400 animate-pulse" /> : <Sun size={14} />}
            <span className="hidden sm:inline text-[11px]">
              {wakeLockActive ? 'Awake Active' : 'Keep Awake'}
            </span>
          </button>

          {/* Exit Button */}
          <button
            id="exit-cooking-mode-btn"
            onClick={() => setShowExitConfirm(true)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Exit Cooking Mode"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Progress Bar & Step Tracker */}
      <div className="px-5 pt-3 pb-1 bg-[#161616]">
        <div className="flex items-center justify-between text-xs text-white/70 mb-1.5 font-medium">
          <span>
            Step <strong className="text-white">{cookingStepIndex + 1}</strong> of {totalSteps}
          </span>
          <span className="text-[#FF5A3C] font-bold">{progressPercent}% complete</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-[#FF5A3C] to-amber-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Focus: Step Instruction & Direct Timer Trigger */}
      <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-center max-w-xl mx-auto w-full">
        {/* Step Card */}
        <div className="bg-[#1E1E1E] rounded-[32px] p-6 sm:p-8 border border-white/10 shadow-2xl relative">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 bg-[#FF5A3C] text-white text-[11px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-sm">
              Step {cookingStepIndex + 1} of {totalSteps}
            </span>
            <span className="text-xs text-white/50 font-mono">
              {cookingStepIndex + 1}/{totalSteps}
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif italic text-white tracking-tight leading-snug">
            {stepTitle}
          </h3>

          <p className="text-base sm:text-lg text-white/90 mt-4 leading-relaxed font-normal">
            {stepText}
          </p>

          {/* Timing Cue with [Start Timer] CTA */}
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Clock size={18} />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                  Cooking Time Cue
                </span>
                <span className="text-sm font-semibold text-amber-100">{timingCue}</span>
              </div>
            </div>

            <button
              id="start-step-timer-cue-btn"
              onClick={() => startStepTimer(detectedMinutes)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-[#171717] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Play size={14} className="fill-[#171717]" />
              <span>Start Timer ({detectedMinutes}m)</span>
            </button>
          </div>

          {/* Chef Tip / Secret */}
          {stepTip && (
            <div className="mt-4 p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
              <Lightbulb size={16} className="flex-shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong className="text-amber-200">Chef's Advice:</strong> {stepTip}
              </span>
            </div>
          )}
        </div>

        {/* Large Kitchen Countdown Timer Controls */}
        <div className="mt-5 bg-[#1A1A1A] rounded-[28px] p-5 border border-white/10 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold block mb-0.5">
              Active Step Timer
            </span>
            <span className="text-3xl sm:text-4xl font-serif font-light tracking-wider text-[#FF5A3C]">
              {formatTimer(cookingTimerSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addOneMinute}
              className="px-3.5 py-2.5 text-xs font-extrabold rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Add 1 minute"
            >
              +1m
            </button>
            <button
              onClick={resetTimer}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={toggleTimer}
              className={`px-5 py-3.5 rounded-2xl font-extrabold text-xs text-white transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
                isTimerRunning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#FF5A3C] hover:bg-[#E2482B]'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause size={16} /> Pause
                </>
              ) : (
                <>
                  <Play size={16} className="fill-white translate-x-0.5" /> Start
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Large Navigation Controls (Previous / Next) */}
      <footer className="p-5 border-t border-white/10 bg-[#1A1A1A]/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 max-w-xl mx-auto w-full">
          <button
            id="cooking-prev-btn"
            onClick={handlePrev}
            disabled={cookingStepIndex === 0}
            className={`min-h-[52px] px-6 rounded-2xl font-extrabold text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
              cookingStepIndex === 0
                ? 'opacity-30 cursor-not-allowed bg-white/5 text-white/30'
                : 'bg-white/10 hover:bg-white/20 text-white active:scale-95'
            }`}
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>

          <button
            id="cooking-next-btn"
            onClick={handleNext}
            className="min-h-[52px] flex-1 flex items-center justify-center gap-2 px-6 rounded-2xl font-extrabold text-base bg-[#FF5A3C] hover:bg-[#E2482B] active:scale-[0.98] text-white shadow-xl shadow-[#FF5A3C]/20 transition-all cursor-pointer"
          >
            {cookingStepIndex === totalSteps - 1 ? (
              <>
                <CheckCircle2 size={20} />
                <span>Finish Recipe</span>
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div
          id="exit-confirm-overlay"
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-[#222222] rounded-[32px] p-6 border border-white/15 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Exit Cooking Mode?</h4>
            <p className="text-xs text-white/70 leading-relaxed mb-6">
              Your current progress on <strong className="text-white">Step {cookingStepIndex + 1} of {totalSteps}</strong> will be preserved. You can resume anytime.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-3 bg-[#FF5A3C] hover:bg-[#E2482B] text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Resume Cooking
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  exitCookingMode();
                }}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white/80 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Exit to Recipe Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

