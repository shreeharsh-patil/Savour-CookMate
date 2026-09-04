import React from 'react';
import { X, ExternalLink, Play } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const YouTubePlayerModal: React.FC = () => {
  const { activeVideo, setActiveVideo } = useAppStore();

  if (!activeVideo) return null;

  return (
    <div
      id="youtube-player-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg bg-[#171717] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-red-600 text-white">
              <Play size={14} className="fill-white translate-x-0.5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white line-clamp-1">{activeVideo.title}</h3>
              <p className="text-[10px] text-white/60">{activeVideo.channelTitle}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveVideo(null)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video Player Frame */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={activeVideo.embedUrl}
            title={activeVideo.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Video Footer info */}
        <div className="p-4 flex items-center justify-between text-xs text-white/70">
          <span className="line-clamp-1">{activeVideo.description || 'Verified culinary cooking guide'}</span>
          <a
            href={activeVideo.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 flex items-center gap-1 font-bold text-[#FF5A3C] hover:underline ml-3"
          >
            Open YouTube <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};
