import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Film, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { mediaService } from '../../api/services/media';
import { getImageUrl } from '../../api/config';
import { cn } from '../../lib/utils';
import { WatchHistoryItem } from '../../store/useStore';

interface ContinueWatchingSectionProps {
  items: WatchHistoryItem[];
}

const ContinueWatchingSection: React.FC<ContinueWatchingSectionProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const episodeQueries = useQuery({
    queryKey: ['episodes', items.map(item => `${item.id}-${item.season}-${item.episode}`)],
    queryFn: async () => {
      const episodeDetails = await Promise.all(
        items
          .filter(item => item.mediaType === 'tv' && item.season && item.episode)
          .map(item =>
            mediaService.getTVSeasonDetails(item.id, item.season!)
              .then(season => season.episodes.find(ep => ep.episode_number === item.episode))
          )
      );
      return episodeDetails;
    },
    enabled: items.some(item => item.mediaType === 'tv'),
  });

  const checkScrollPosition = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    const newScrollLeft = direction === 'left'
      ? containerRef.current.scrollLeft - scrollAmount
      : containerRef.current.scrollLeft + scrollAmount;

    containerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatSeasonEpisode = (season: number, episode: number) => {
    return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
  };

  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const onDrag = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - (containerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      <div className="bg-light-surface/30 dark:bg-dark-surface/30 backdrop-blur-xl border border-border-light/30 dark:border-border-dark/30 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 md:px-8 py-6 border-b border-border-light/30 dark:border-border-dark/30 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-light-text-primary dark:text-dark-text-primary uppercase tracking-tight">
              Continue Watching
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mt-1">
              Pick up where you left off
            </p>
          </div>

          {/* Navigation Buttons */}
          <AnimatePresence>
            {canScrollLeft && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scroll('left')}
                className="hidden lg:flex absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-light-surface/80 dark:bg-dark-surface/80 hover:bg-accent/80 text-light-text-primary dark:text-dark-text-primary hover:text-white border border-border-light dark:border-border-dark hover:border-accent rounded-full items-center justify-center transition-all backdrop-blur-md z-20 shadow-xl"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canScrollRight && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scroll('right')}
                className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-light-surface/80 dark:bg-dark-surface/80 hover:bg-accent/80 text-light-text-primary dark:text-dark-text-primary hover:text-white border border-border-light dark:border-border-dark hover:border-accent rounded-full items-center justify-center transition-all backdrop-blur-md z-20 shadow-xl"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Cards Container */}
        <div className="p-4 md:p-8">
          <div
            ref={containerRef}
            className="overflow-x-auto scrollbar-none"
            onMouseDown={startDrag}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onMouseMove={onDrag}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div className="flex gap-4 md:gap-6">
              {items.map((item, index) => {
                const episodeDetails = item.mediaType === 'tv' ? episodeQueries.data?.[index] : null;
                const progress = item.progress
                  ? Math.round((item.progress.watched / item.progress.duration) * 100)
                  : 0;
                const remaining = item.progress
                  ? item.progress.duration - item.progress.watched
                  : 0;

                return (
                  <motion.div
                    key={`${item.mediaType}-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex-shrink-0 w-[85vw] sm:w-[400px] lg:w-[450px]"
                  >
                    <Link
                      to={`/watch/${item.mediaType}/${item.id}${
                        item.mediaType === 'tv' ? `?season=${item.season}&episode=${item.episode}` : ''
                      }`}
                      className="group relative block h-full"
                      onClick={(e) => {
                        if (isDragging) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="relative rounded-2xl overflow-hidden border border-border-light/50 dark:border-border-dark/50 bg-light-surface dark:bg-dark-surface group-hover:border-accent/50 transition-all duration-300 h-full">
                        {/* Thumbnail */}
                        <div className="aspect-video relative overflow-hidden bg-light-surface dark:bg-dark-surface">
                          <img
                            src={getImageUrl(
                              item.mediaType === 'tv' && episodeDetails?.still_path
                                ? episodeDetails.still_path
                                : item.posterPath,
                              'w780'
                            )}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-light-text-primary/60 via-transparent to-transparent dark:from-dark-text-primary/60" />

                          {/* Play Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20">
                              <Play className="w-7 h-7 text-white fill-current ml-1" />
                            </div>
                          </div>

                          {/* Media Type Badge */}
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-md border border-border-light/50 dark:border-border-dark/50 rounded-lg text-[10px] md:text-xs font-bold text-light-text-primary dark:text-dark-text-primary">
                              {item.mediaType === 'movie' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                              {item.mediaType === 'movie' ? 'MOVIE' : 'TV'}
                            </span>
                          </div>

                          {/* Duration */}
                          {item.progress && (
                            <div className="absolute bottom-3 right-3">
                              <span className="px-2.5 py-1 bg-light-text-primary/80 dark:bg-dark-text-primary/80 text-light-bg dark:text-dark-bg rounded-lg text-[10px] md:text-xs font-bold uppercase">
                                {formatDuration(remaining)} left
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info Section */}
                        <div className="p-4">
                          <h3 className="text-light-text-primary dark:text-dark-text-primary font-bold text-base md:text-lg line-clamp-1 mb-2">
                            {item.title}
                          </h3>

                          {item.mediaType === 'tv' && item.season && item.episode && episodeDetails && (
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-xs md:text-sm mb-3 line-clamp-1">
                              <span className="font-semibold text-accent">
                                {formatSeasonEpisode(item.season, item.episode)}
                              </span>
                              {' '} • {episodeDetails.name}
                            </p>
                          )}

                          {/* Progress Bar */}
                          {item.progress && (
                            <div className="space-y-2">
                              <div className="h-1.5 bg-light-text-secondary/20 dark:bg-dark-text-secondary/20 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${progress}%` }}
                                  transition={{ delay: 0.1, duration: 0.8 }}
                                  className="h-full bg-accent rounded-full"
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] md:text-xs text-light-text-secondary/60 dark:text-dark-text-secondary/60 font-medium">
                                <span>{progress}%</span>
                                <span>{formatDuration(item.progress.duration)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContinueWatchingSection;
