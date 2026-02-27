import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { BackendApiResponse, BackendSource, BackendSubtitle } from '../types/api';

interface VideoPlayerProps {
  apiResponse: BackendApiResponse;
}

// million-ignore
const SourceList = ({
  sources,
  currentSource,
  onSelect
}: {
  sources: BackendSource[],
  currentSource: BackendSource | null,
  onSelect: (src: BackendSource) => void
}) => (
  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
    {sources.map((src, i) => (
      <button
        key={i}
        onClick={() => onSelect(src)}
        className={`w-full text-left px-3.5 py-3 rounded-xl hover:bg-white/5 text-sm flex justify-between items-center transition-all border border-transparent ${currentSource === src ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'text-gray-300 hover:border-white/10'}`}
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-bold tracking-tight">{src.quality}p</span>
          <span className="text-[10px] opacity-40 uppercase font-black tracking-widest">{src.type}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] bg-white/5 px-2 py-1 rounded-md text-white/50 uppercase font-black tracking-tighter border border-white/5">{src.provider.name}</span>
          {src.language && <span className="text-[9px] opacity-30 uppercase font-bold">{src.language}</span>}
        </div>
      </button>
    ))}
  </div>
);

// million-ignore
const SubtitleList = ({
  subtitles,
  currentSubtitle,
  onSelect
}: {
  subtitles: BackendSubtitle[],
  currentSubtitle: BackendSubtitle | null,
  onSelect: (sub: BackendSubtitle | null) => void
}) => (
  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
    <button
      onClick={() => onSelect(null)}
      className={`w-full text-left px-3.5 py-3 rounded-xl hover:bg-white/5 text-sm transition-all border border-transparent ${currentSubtitle === null ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'text-gray-300 hover:border-white/10'}`}
    >
      None (Off)
    </button>
    {subtitles.map((sub, i) => (
      <button
        key={i}
        onClick={() => onSelect(sub)}
        className={`w-full text-left px-3.5 py-3 rounded-xl hover:bg-white/5 text-sm transition-all border border-transparent ${currentSubtitle === sub ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'text-gray-300 hover:border-white/10'}`}
      >
        <span className="font-bold">{sub.label}</span>
        {sub.format && <span className="ml-2 text-[9px] opacity-30 uppercase">{sub.format}</span>}
      </button>
    ))}
  </div>
);

// million-ignore
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ apiResponse }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentSource, setCurrentSource] = useState<BackendSource | null>(apiResponse.sources[0] || null);
  const [currentSubtitle, setCurrentSubtitle] = useState<BackendSubtitle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!videoRef.current || !currentSource) return;

    const video = videoRef.current;
    setIsLoading(true);

    // Cleanup existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (currentSource.type === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
        });
        hls.loadSource(currentSource.url);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentSource.url;
      }
    } else {
      video.src = currentSource.url;
    }

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentSource]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const time = (Number(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const vol = Number(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const skip = (amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden group select-none"
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
      >
        {currentSubtitle && (
          <track
            kind="subtitles"
            src={currentSubtitle.url}
            label={currentSubtitle.label}
            default
          />
        )}
      </video>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 flex flex-col justify-end p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent ${showControls ? 'opacity-100' : 'opacity-0 cursor-none'}`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Progress Bar */}
        <div className="w-full mb-6 relative group/progress">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress || 0}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500 group-hover/progress:h-2 transition-all"
          />
          <div
            className="absolute top-0 left-0 h-1.5 bg-blue-500 rounded-full pointer-events-none group-hover/progress:h-2 transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={(e) => skip(-10, e)} className="hover:text-blue-400 transition-colors p-1">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
            </button>
            <button onClick={togglePlay} className="hover:text-blue-400 transition-all active:scale-90">
              {isPlaying ? (
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button onClick={(e) => skip(10, e)} className="hover:text-blue-400 transition-colors p-1">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 8c2.65 0 5.05 1 6.9 2.6L22 7v9h-9l3.62-3.62c-1.39-1.16-3.16-1.88-5.12-1.88-3.54 0-6.55 2.31-7.6 5.5l-2.37-.78C2.92 11.03 6.85 8 11.5 8z"/></svg>
            </button>

            <div className="flex items-center gap-3 group/volume ml-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setVolume(volume === 0 ? 1 : 0);
                  if (videoRef.current) videoRef.current.volume = volume === 0 ? 1 : 0;
                }}
                className="hover:text-blue-400 transition-colors"
              >
                {volume === 0 ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-24 transition-all duration-300 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <span className="text-sm font-medium ml-4 tabular-nums">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Quality Selector */}
            <div className="relative group/quality">
              <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-3 active:scale-95">
                <span>{currentSource?.quality}p</span>
                <svg className="w-3.5 h-3.5 opacity-40 transition-transform group-hover/quality:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div className="absolute bottom-full right-0 mb-4 w-72 bg-gray-900/95 border border-white/10 rounded-2xl hidden group-hover/quality:block p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[11px] font-black text-white/40 mb-4 px-2 uppercase tracking-[0.2em]">Source Selection</div>
                <SourceList
                  sources={apiResponse.sources}
                  currentSource={currentSource}
                  onSelect={setCurrentSource}
                />
              </div>
            </div>

            {/* Subtitles Selector */}
            <div className="relative group/subtitles">
              <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-3 active:scale-95">
                <span>Captions</span>
                <svg className="w-3.5 h-3.5 opacity-40 transition-transform group-hover/subtitles:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div className="absolute bottom-full right-0 mb-4 w-60 bg-gray-900/95 border border-white/10 rounded-2xl hidden group-hover/subtitles:block p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[11px] font-black text-white/40 mb-4 px-2 uppercase tracking-[0.2em]">Captions</div>
                <SubtitleList
                  subtitles={apiResponse.subtitles}
                  currentSubtitle={currentSubtitle}
                  onSelect={setCurrentSubtitle}
                />
              </div>
            </div>

            {/* Fullscreen Toggle */}
            <button onClick={(e) => toggleFullscreen(e)} className="hover:text-blue-400 transition-all active:scale-90 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};
