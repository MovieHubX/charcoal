import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video as VideoIcon } from 'lucide-react';
import { useStore, WatchStatus } from '../store/useStore';
import { useMovieDetails } from '../api/hooks/useMovieDetails';
import DetailsBanner from '../components/shared/DetailsBanner';
import RelatedVideos from '../components/shared/RelatedVideos';

const MovieDetails = () => {
  const { id } = useParams();
  const { details, isLoading, contentRating } = useMovieDetails(id);
  const { addToWatchlist, removeFromWatchlist, getWatchlistItem, watchHistory } = useStore();

  const watchlistItem = getWatchlistItem(Number(id), 'movie');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading || !details) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  const year = new Date(details.release_date).getFullYear();

  const handleWatchlistAdd = (status: WatchStatus) => {
    addToWatchlist({
      id: Number(id),
      mediaType: 'movie',
      title: details.title,
      posterPath: details.poster_path,
      addedAt: Date.now(),
      status,
    });
  };

  const youtubeVideos = (details.videos?.results.filter(video =>
    video.site === 'YouTube' &&
    (video.type === 'Trailer' || video.type === 'Teaser' || video.type === 'Behind the Scenes')
  ) || []).slice(0, 7);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen space-y-12 pb-20"
    >
      <DetailsBanner
        type="movie"
        title={details.title}
        year={year}
        overview={details.overview}
        posterPath={details.poster_path}
        backdropPath={details.backdrop_path}
        rating={details.vote_average}
        runtime={details.runtime}
        contentRating={contentRating}
        genres={details.genres}
        watchlistItem={watchlistItem}
        onWatchlistAdd={handleWatchlistAdd}
        onWatchlistRemove={() => removeFromWatchlist(Number(id), 'movie')}
        id={id!}
        watchHistory={watchHistory}
      />

      {youtubeVideos.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative px-4 md:px-0"
        >
          <div className="bg-light-surface/30 dark:bg-dark-surface/30 backdrop-blur-xl border border-border-light/30 dark:border-border-dark/30 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="px-4 md:px-8 py-6 border-b border-border-light/30 dark:border-border-dark/30 flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-xl border border-accent/30">
                <VideoIcon className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-2xl font-black text-light-text-primary dark:text-dark-text-primary uppercase tracking-tighter">Related Videos</h2>
              <span className="text-light-text-secondary/40 dark:text-dark-text-secondary/40 ml-auto font-mono text-sm">{youtubeVideos.length} Items</span>
            </div>
            <div className="p-4 md:p-8">
              <RelatedVideos videos={youtubeVideos} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MovieDetails;
