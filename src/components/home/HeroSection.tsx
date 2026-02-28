import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Bookmark, ChevronLeft, ChevronRight, Star, Film, Tv, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie, TVShow } from '../../api/types';
import { getImageUrl } from '../../api/config';
import { cn } from '../../lib/utils';
import WatchlistMenu from '../shared/WatchlistMenu';
import { useStore, WatchStatus } from '../../store/useStore';
import { useQuery } from '@tanstack/react-query';
import { genreService } from '../../api/services/genres';
import { mediaService } from '../../api/services/media';
import { useMedia } from '../../api/hooks/useMedia';

interface HeroSectionProps {
  items: (Movie | TVShow)[];
}

const HeroSection: React.FC<HeroSectionProps> = ({ items }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const { addToWatchlist, removeFromWatchlist, getWatchlistItem } = useStore();

  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: genreService.getAllGenres,
  });

  const currentItem = items[currentIndex];
  const isMovie = currentItem && 'title' in currentItem;
  const mediaType = isMovie ? 'movie' : 'tv';

  const { data: contentRating } = useMedia.useContentRating(
    mediaType, 
    currentItem?.id
  );

  const { data: images } = useQuery({
    queryKey: ['images', currentItem?.id],
    queryFn: () => mediaService.getImages(mediaType, currentItem.id),
    enabled: !!currentItem
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
        setTimeout(() => setIsAnimating(false), 500);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [isAnimating, items.length]);

  if (!items.length) return null;

  const title = isMovie ? currentItem.title : currentItem.name;
  const overview = currentItem.overview;
  const releaseDate = isMovie ? currentItem.release_date : currentItem.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const watchlistItem = getWatchlistItem(currentItem.id, mediaType);

  const handleWatchlistAdd = (status: WatchStatus) => {
    addToWatchlist({
      id: currentItem.id,
      mediaType,
      title,
      posterPath: currentItem.poster_path,
      addedAt: Date.now(),
      status,
    });
    setIsWatchlistOpen(false);
  };

  const handleWatchlistRemove = () => {
    removeFromWatchlist(currentItem.id, mediaType);
    setIsWatchlistOpen(false);
  };

  const handleDetailClick = () => {
    navigate(`/${mediaType}/${currentItem.id}`);
  };

  const getGenreNames = (genreIds: number[]) => {
    return genreIds.map(id => genres.find(g => g.id === id)?.name).filter(Boolean);
  };

  const logo = images?.logos?.find(logo =>
    logo.iso_639_1 === 'en' || !logo.iso_639_1
  );

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="relative w-full h-[350px] md:h-[500px] lg:h-[600px] rounded-[2rem] overflow-hidden group/hero">
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={getImageUrl(currentItem.backdrop_path, 'original')}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-light-bg via-light-bg/40 to-transparent dark:from-dark-bg dark:via-dark-bg/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-light-bg/60 via-transparent to-transparent dark:from-dark-bg/60 dark:via-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Logo Badge */}
      {logo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 md:top-8 right-6 md:right-8 z-20"
        >
          <img
            src={getImageUrl(logo.file_path, 'w300')}
            alt={title}
            className="h-8 md:h-10 max-w-[120px] object-contain opacity-40"
          />
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10 lg:p-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 md:space-y-6"
        >
          {/* Type Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-md border border-border-light/50 dark:border-border-dark/50 rounded-full text-xs md:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
              {isMovie ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
              {isMovie ? 'Movie' : 'TV Series'}
            </span>
          </div>

          {/* Title */}
          <motion.h1
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-light-text-primary dark:text-dark-text-primary leading-tight max-w-3xl"
          >
            {title}
          </motion.h1>

          {/* Meta Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 md:gap-6"
          >
            {/* Rating */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/20 backdrop-blur-md border border-yellow-400/30 rounded-lg">
              <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-light-text-primary dark:text-dark-text-primary text-sm md:text-base">
                {currentItem.vote_average.toFixed(1)}
              </span>
            </div>

            {/* Year */}
            {year && (
              <span className="px-3 py-1.5 bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-md border border-border-light/50 dark:border-border-dark/50 rounded-lg text-light-text-primary dark:text-dark-text-primary font-medium text-sm md:text-base">
                {year}
              </span>
            )}

            {/* Content Rating */}
            {contentRating && (
              <span className="px-3 py-1.5 bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-md border border-border-light/50 dark:border-border-dark/50 rounded-lg text-light-text-primary dark:text-dark-text-primary font-medium text-sm md:text-base">
                {contentRating}
              </span>
            )}
          </motion.div>

          {/* Genres */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2"
          >
            {getGenreNames(currentItem.genre_ids).slice(0, 4).map((genre) => (
              <span
                key={genre}
                className="px-3 py-1.5 bg-light-surface/40 dark:bg-dark-surface/40 backdrop-blur-md border border-border-light/30 dark:border-border-dark/30 rounded-full text-xs md:text-sm font-medium text-light-text-primary dark:text-dark-text-primary hover:bg-light-surface/60 dark:hover:bg-dark-surface/60 transition-colors"
              >
                {genre}
              </span>
            ))}
          </motion.div>

          {/* Overview */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-light-text-secondary dark:text-dark-text-secondary text-sm md:text-base max-w-2xl line-clamp-3 leading-relaxed"
          >
            {overview}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 pt-4"
          >
            {/* Play Button */}
            <Link
              to={`/watch/${mediaType}/${currentItem.id}`}
              className="w-full sm:w-auto px-8 py-3.5 md:py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-accent/20 active:scale-95 group/play border border-white/20 font-bold uppercase tracking-wide text-sm md:text-base"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 fill-current group-hover/play:scale-110 transition-transform" />
              Play
            </Link>

            {/* Details Button */}
            <button
              onClick={handleDetailClick}
              className="w-full sm:w-auto px-8 py-3.5 md:py-4 bg-light-surface dark:bg-dark-surface hover:bg-light-surface/80 dark:hover:bg-dark-surface/80 text-light-text-primary dark:text-dark-text-primary border border-border-light dark:border-border-dark rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 group/details font-bold uppercase tracking-wide text-sm md:text-base"
            >
              Details
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/details:translate-x-1 transition-transform" />
            </button>

            {/* Watchlist Button */}
            <div className="relative">
              <button
                onClick={() => setIsWatchlistOpen(!isWatchlistOpen)}
                className={cn(
                  "w-full sm:w-auto px-4 md:px-6 py-3.5 md:py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border font-bold uppercase tracking-wide text-sm md:text-base",
                  watchlistItem
                    ? "bg-accent/20 border-accent/50 text-accent hover:bg-accent/30"
                    : "bg-light-surface dark:bg-dark-surface border-border-light dark:border-border-dark text-light-text-primary dark:text-dark-text-primary hover:border-accent/50"
                )}
              >
                <Bookmark className={cn("w-5 h-5", watchlistItem && "fill-current")} />
              </button>
              <WatchlistMenu
                isOpen={isWatchlistOpen}
                onClose={() => setIsWatchlistOpen(false)}
                onAdd={handleWatchlistAdd}
                onRemove={handleWatchlistRemove}
                currentStatus={watchlistItem?.status}
                position="top-left"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        {/* Dots Indicator */}
        <div className="flex gap-1.5">
          {items.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsAnimating(false), 500);
                }
              }}
              initial={false}
              animate={{
                width: index === currentIndex ? 24 : 8,
                backgroundColor: index === currentIndex ? 'rgb(220, 38, 38)' : 'rgba(255, 255, 255, 0.3)',
              }}
              className="h-2 rounded-full transition-all cursor-pointer"
            />
          ))}
        </div>

        {/* Arrow Controls */}
        <div className="hidden md:flex gap-2">
          <motion.button
            onClick={handlePrev}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-light-surface/80 dark:bg-dark-surface/80 hover:bg-accent/80 text-light-text-primary dark:text-dark-text-primary hover:text-white border border-border-light dark:border-border-dark hover:border-accent rounded-full flex items-center justify-center transition-all backdrop-blur-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={handleNext}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-light-surface/80 dark:bg-dark-surface/80 hover:bg-accent/80 text-light-text-primary dark:text-dark-text-primary hover:text-white border border-border-light dark:border-border-dark hover:border-accent rounded-full flex items-center justify-center transition-all backdrop-blur-md"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
