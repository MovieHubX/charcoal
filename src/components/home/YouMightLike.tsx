import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Play, Bookmark, Film, Tv } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie, TVShow } from '../../api/types';
import { getImageUrl } from '../../api/config';
import { cn } from '../../lib/utils';
import { useQuery, useQueries } from '@tanstack/react-query';
import { genreService } from '../../api/services/genres';
import WatchlistMenu from '../shared/WatchlistMenu';
import { useStore, WatchStatus } from '../../store/useStore';

interface YouMightLikeProps {
  items: (Movie | TVShow)[];
}

const YouMightLike: React.FC<YouMightLikeProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { addToWatchlist, removeFromWatchlist, getWatchlistItem } = useStore();
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: genreService.getAllGenres,
  });

  const contentRatingQueries = useQueries({
    queries: items.map(item => ({
      queryKey: ['contentRating', item.id],
      queryFn: async () => {
        const response = await fetch(
          `https://api.themoviedb.org/3/${'title' in item ? 'movie' : 'tv'}/${item.id}?api_key=50404130561567acf3e0725aeb09ec5d&append_to_response=release_dates,content_ratings`
        );
        const data = await response.json();
        
        if ('title' in item) {
          const usRating = data.release_dates?.results?.find(
            (r: any) => r.iso_3166_1 === 'US'
          )?.release_dates?.[0]?.certification;
          return usRating || null;
        }
        
        const usRating = data.content_ratings?.results?.find(
          (r: any) => r.iso_3166_1 === 'US'
        )?.rating;
        return usRating || null;
      }
    }))
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
    const newScrollLeft =
      direction === 'left'
        ? containerRef.current.scrollLeft - scrollAmount
        : containerRef.current.scrollLeft + scrollAmount;

    containerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
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

  const getGenreNames = (genreIds: number[]) => {
    return genreIds.map(id => genres.find(g => g.id === id)?.name).filter(Boolean);
  };

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
              You Might Like
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mt-1">
              Trending and recommended for you
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
                const isMovie = 'title' in item;
                const title = isMovie ? item.title : item.name;
                const releaseDate = isMovie ? item.release_date : item.first_air_date;
                const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
                const watchlistItem = getWatchlistItem(item.id, isMovie ? 'movie' : 'tv');
                const contentRating = contentRatingQueries[index]?.data;

                const handleWatchlistAdd = (status: WatchStatus) => {
                  addToWatchlist({
                    id: item.id,
                    mediaType: isMovie ? 'movie' : 'tv',
                    title,
                    posterPath: item.poster_path,
                    addedAt: Date.now(),
                    status,
                  });
                  setActiveMenu(null);
                };

                const handleWatchlistRemove = () => {
                  removeFromWatchlist(item.id, isMovie ? 'movie' : 'tv');
                  setActiveMenu(null);
                };

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex-shrink-0 w-[85vw] sm:w-[400px] lg:w-[450px]"
                  >
                    <Link
                      to={`/${isMovie ? 'movie' : 'tv'}/${item.id}`}
                      className="group relative block h-full"
                      onClick={(e) => {
                        if (isDragging) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="relative rounded-2xl overflow-hidden border border-border-light/50 dark:border-border-dark/50 bg-light-surface dark:bg-dark-surface group-hover:border-accent/50 transition-all duration-300 h-full shadow-xl hover:shadow-2xl">
                        {/* Thumbnail */}
                        <div className="aspect-video relative overflow-hidden bg-light-surface dark:bg-dark-surface">
                          <img
                            src={getImageUrl(item.backdrop_path, 'w780')}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                              {isMovie ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                              {isMovie ? 'MOVIE' : 'TV'}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute bottom-3 right-3 flex flex-col gap-2" onClick={(e) => e.preventDefault()}>
                            <Link
                              to={`/watch/${isMovie ? 'movie' : 'tv'}/${item.id}`}
                              className="w-10 h-10 bg-accent hover:bg-accent/90 rounded-xl flex items-center justify-center transition-all shadow-lg group/play border border-white/20"
                            >
                              <Play className="w-5 h-5 text-white fill-current group-hover/play:scale-110 transition-transform ml-0.5" />
                            </Link>

                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveMenu(activeMenu === item.id ? null : item.id);
                                }}
                                className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md border",
                                  watchlistItem
                                    ? "bg-light-surface dark:bg-dark-surface border-accent/50 text-accent"
                                    : "bg-light-surface/50 dark:bg-dark-surface/50 border-border-light/50 dark:border-border-dark/50 text-light-text-primary dark:text-dark-text-primary hover:bg-light-surface dark:hover:bg-dark-surface"
                                )}
                              >
                                <Bookmark className={cn("w-5 h-5", watchlistItem && "fill-current")} />
                              </button>

                              <WatchlistMenu
                                isOpen={activeMenu === item.id}
                                onClose={() => setActiveMenu(null)}
                                onAdd={handleWatchlistAdd}
                                onRemove={handleWatchlistRemove}
                                currentStatus={watchlistItem?.status}
                                position="top-left"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Info Section */}
                        <div className="p-4">
                          <h3 className="text-light-text-primary dark:text-dark-text-primary font-bold text-base md:text-lg line-clamp-1 mb-2">
                            {title}
                          </h3>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-400/20 rounded-lg">
                              <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-400 fill-yellow-400" />
                              <span className="text-light-text-primary dark:text-dark-text-primary font-semibold text-xs md:text-sm">
                                {item.vote_average.toFixed(1)}
                              </span>
                            </div>

                            {year && (
                              <span className="text-light-text-secondary dark:text-dark-text-secondary text-xs md:text-sm font-medium">
                                {year}
                              </span>
                            )}

                            {contentRating && (
                              <span className="px-2 py-1 bg-light-surface dark:bg-dark-surface border border-border-light/50 dark:border-border-dark/50 text-light-text-primary dark:text-dark-text-primary rounded-lg text-xs md:text-sm font-medium">
                                {contentRating}
                              </span>
                            )}
                          </div>

                          {/* Genres - Circular tags */}
                          <div className="flex flex-wrap gap-1.5">
                            {getGenreNames(item.genre_ids).slice(0, 3).map((genreName) => (
                              <span
                                key={genreName}
                                className="px-2.5 py-1 bg-light-surface/50 dark:bg-dark-surface/50 border border-border-light/30 dark:border-border-dark/30 text-light-text-primary dark:text-dark-text-primary text-[10px] md:text-xs font-medium rounded-full hover:border-accent/50 transition-colors"
                              >
                                {genreName}
                              </span>
                            ))}
                          </div>
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

export default YouMightLike;
