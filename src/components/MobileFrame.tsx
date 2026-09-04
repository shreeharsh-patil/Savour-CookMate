import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Maximize2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const { deviceFrame, toggleDeviceFrame, toastMessage } = useAppStore();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F3EFE9] flex flex-col items-center justify-start py-0 md:py-4 px-0 md:px-4 selection:bg-[#FF5A3C] selection:text-white transition-colors duration-300">
      {/* Top Device Switcher Toolbar */}
      <div className="hidden md:flex items-center justify-between w-full max-w-md mb-2 px-3 py-1.5 text-xs text-[#737373] bg-white/70 backdrop-blur-md rounded-xl border border-[#E8E3DA] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-[#171717]">Savor Live</span>
          <span className="text-[10px] bg-[#FFF0ED] text-[#FF5A3C] font-bold px-1.5 py-0.5 rounded-sm">Gemini 3.8-Flash</span>
        </div>
        <button
          id="toggle-device-frame-btn"
          onClick={toggleDeviceFrame}
          className="flex items-center gap-1.5 font-medium hover:text-[#171717] px-2 py-1 rounded-md hover:bg-[#F3EFE9] transition-colors cursor-pointer"
        >
          {deviceFrame ? (
            <>
              <Maximize2 size={13} />
              <span>Wide View</span>
            </>
          ) : (
            <>
              <Smartphone size={13} />
              <span>Mobile Frame</span>
            </>
          )}
        </button>
      </div>

      {/* Main Canvas / Device Enclosure */}
      <div
        id="app-device-container"
        className={`relative w-full ${
          deviceFrame
            ? 'max-w-md md:rounded-[44px] md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] md:border-[10px] md:border-[#1E1E1E]'
            : 'max-w-xl md:rounded-3xl md:shadow-lg md:border md:border-[#E8E3DA]'
        } bg-[#FFFDF9] min-h-screen md:min-h-[844px] md:max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Mobile Status Bar (Visible in Mobile Frame mode or on small screens) */}
        <div
          id="mobile-status-bar"
          className="sticky top-0 z-40 bg-[#FFFDF9]/90 backdrop-blur-md px-6 pt-3 pb-1 flex items-center justify-between text-xs font-semibold text-[#171717]"
        >
          <span id="status-clock" className="tracking-tight text-[13px]">{currentTime || '12:00'}</span>

          {/* Dynamic Island / Notch Pill */}
          <div className="w-24 h-4 bg-[#171717] rounded-full mx-auto hidden sm:flex items-center justify-end pr-2">
            <span className="w-2 h-2 rounded-full bg-[#343434]" />
          </div>

          <div className="flex items-center gap-1.5 text-[#171717]">
            <Signal size={13} strokeWidth={2.5} />
            <Wifi size={13} strokeWidth={2.5} />
            <BatteryMedium size={15} strokeWidth={2.5} />
          </div>
        </div>

        {/* Dynamic Toast Notification */}
        {toastMessage && (
          <div
            id="app-toast"
            className="fixed md:absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#171717] text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg border border-white/10 flex items-center gap-2 animate-bounce"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A3C]" />
            {toastMessage}
          </div>
        )}

        {/* Scrollable View Content */}
        <div id="main-scroll-viewport" className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {children}
        </div>

        {/* Bottom Home Indicator Bar for iOS feel */}
        <div className="pointer-events-none sticky bottom-0 w-full flex justify-center pb-1 pt-0.5 bg-transparent z-40">
          <div className="w-32 h-1 bg-[#171717]/25 rounded-full" />
        </div>
      </div>
    </div>
  );
};
