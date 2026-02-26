import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MediaPlayer,
  MediaProvider,
  Track,
} from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { Loader2, AlertCircle, RefreshCcw, Zap } from 'lucide-react';
import { useJellySources } from '../../api/hooks/useJelly';
import { JellySource } from '../../api/services/jelly';
import { cn } from '../../lib/utils';

interface CustomPlayerProps {
  tmdbId: string;
  type: 'movie' | 'tv';
  embedUrl?: string;
  season?: number;
  episode?: number;
  useJelly?: boolean;
}

const getQualityValue = (q: string): number => {
  const lower = q.toLowerCase();
  if (lower.includes('2160') || lower.includes('4k')) return 2160;
  if (lower.includes('1440') || lower.includes('2k')) return 1440;
  if (lower.includes('1080')) return 1080;
  if (lower.includes('720')) return 720;
  if (lower.includes('480')) return 480;
  if (lower.includes('360')) return 360;
  const num = parseInt(q);
  return isNaN(num) ? 0 : num;
};

const formatQualityLabel = (quality: string): string => {
  const value = getQualityValue(quality);
  if (value === 2160) return '4K';
  if (value === 1440) return '2K';
  if (value >= 1080) return '1080p';
  if (value >= 720) return '720p';
  if (value >= 480) return '480p';
  if (value >= 360) return '360p';
  return 'Auto';
};

const formatProvider = (name: string): string => {
  if (!name) return 'Source';
  return name.replace(/([A-Z])/g, ' $1').trim();
};

const CustomPlayer: React.FC<CustomPlayerProps> = ({
  tmdbId,
  type,
  embedUrl,
  season,
  episode,
  useJelly = true,
}) => {
  const { data: jellyData, isLoading, isError, refetch } = useJellySources({
    tmdbId,
    type,
    season,
    episode,
    enabled: useJelly
  });

  const player = useRef<any>(null);
  const [selectedSource, setSelectedSource] = useState<JellySource | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const sortedSources = useMemo(() => {
    if (!jellyData?.sources) return [];

    return [...jellyData.sources]
      .sort((a, b) => {
        const qA = getQualityValue(a.quality);
        const qB = getQualityValue(b.quality);
        if (qB !== qA) return qB - qA;
        return (a.provider?.name || '').localeCompare(b.provider?.name || '');
      });
  }, [jellyData]);

  const uniqueQualities = useMemo(() => {
    const seen = new Set<number>();
    const unique: JellySource[] = [];

    for (const source of sortedSources) {
      const quality = getQualityValue(source.quality);
      if (!seen.has(quality)) {
        seen.add(quality);
        unique.push(source);
      }
    }

    return unique;
  }, [sortedSources]);

  const processedSubtitles = useMemo(() => {
    if (!jellyData?.subtitles) return [];
    const seen = new Set<string>();
    return jellyData.subtitles.filter(sub => {
      if (seen.has(sub.label)) return false;
      seen.add(sub.label);
      return true;
    });
  }, [jellyData]);

  useEffect(() => {
    if (uniqueQualities.length && !selectedSource) {
      const cached = localStorage.getItem('player-quality');
      let source = cached
        ? uniqueQualities.find(s => formatQualityLabel(s.quality) === cached)
        : uniqueQualities.find(s => getQualityValue(s.quality) >= 1080) || uniqueQualities[0];

      setSelectedSource(source || uniqueQualities[0]);
    }
  }, [uniqueQualities, selectedSource]);

  const handleQualityChange = (source: JellySource) => {
    const currentTime = player.current?.currentTime || 0;
    setSelectedSource(source);
    localStorage.setItem('player-quality', formatQualityLabel(source.quality));
    setShowQualityMenu(false);

    if (player.current && currentTime > 0) {
      setTimeout(() => {
        try {
          player.current.currentTime = currentTime;
        } catch (e) {
          // Ignore time jump errors
        }
      }, 50);
    }
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black via-black/80 to-black">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-sm">Loading sources...</p>
        </div>
      </div>
    );
  }

  if ((!sortedSources.length && !isLoading) || isError || localError) {
    if (embedUrl) {
      return (
        <div className="absolute inset-0 bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full border-none"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      );
    }
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black via-black/80 to-black text-white p-6">
        <AlertCircle className="w-14 h-14 text-red-500 mb-4" />
        <h3 className="text-2xl font-bold mb-2">No sources available</h3>
        <p className="text-white/60 mb-8 max-w-sm text-center">
          {localError || "We couldn't find any playable sources for this content. Try another episode or title."}
        </p>
        <button
          onClick={() => { setLocalError(null); refetch(); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 font-medium hover:shadow-lg hover:shadow-blue-500/50"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black overflow-hidden group/player">
      {selectedSource && (
        <MediaPlayer
          ref={player}
          title={type === 'movie' ? 'Movie' : `S${season} E${episode}`}
          src={selectedSource.url}
          onError={() => setLocalError('Source failed. Trying alternative...')}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full"
          playsInline
          autoPlay
          crossOrigin="anonymous"
        >
          <MediaProvider />

          {processedSubtitles.map((sub) => (
            <Track
              key={sub.url}
              src={sub.url}
              kind="subtitles"
              label={sub.label}
              lang="en"
              type="vtt"
            />
          ))}

          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            slots={{
              settingsMenu: null
            }}
          />
        </MediaPlayer>
      )}

      {/* Quality Selector */}
      {uniqueQualities.length > 1 && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-black/70 text-white/80 hover:text-white rounded-lg backdrop-blur-md border border-white/10 opacity-0 group-hover/player:opacity-100 transition-all duration-200 text-xs font-medium uppercase tracking-wide"
            title="Switch quality"
          >
            <Zap className="w-4 h-4" />
            {selectedSource && formatQualityLabel(selectedSource.quality)}
          </button>

          {showQualityMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowQualityMenu(false)}
              />
              <div className="absolute top-14 right-0 w-56 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="p-3 border-b border-white/10">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Quality & Source
                  </h4>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {uniqueQualities.map((source) => {
                    const isSelected = selectedSource?.url === source.url;
                    return (
                      <button
                        key={source.url}
                        onClick={() => handleQualityChange(source)}
                        className={cn(
                          "w-full px-4 py-3 text-left text-sm transition-colors border-l-2",
                          isSelected
                            ? "bg-blue-600/20 border-l-blue-500 text-white font-semibold"
                            : "border-l-transparent text-white/70 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{formatQualityLabel(source.quality)}</span>
                          {isSelected && (
                            <Zap className="w-3.5 h-3.5 text-blue-400" />
                          )}
                        </div>
                        <div className="text-xs text-white/40 mt-1 capitalize">
                          {formatProvider(source.provider.name)} • {source.type.toUpperCase()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error Recovery Badge */}
      {localError && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-red-600/90 text-white text-sm rounded-lg backdrop-blur-md animate-pulse">
          {localError}
        </div>
      )}
    </div>
  );
};

export default CustomPlayer;
