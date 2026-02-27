import React from 'react';
import { VideoPlayer as CustomVideoPlayer } from '../../../imported-player/components/VideoPlayer';
import { BackendApiResponse } from '../../../imported-player/types/api';

interface VideoPlayerProps {
  videoUrl?: string;
  jellyData?: BackendApiResponse | null;
  useCustomPlayer: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, jellyData, useCustomPlayer }) => {
  if (useCustomPlayer && jellyData) {
    return <CustomVideoPlayer apiResponse={jellyData} />;
  }

  if (!videoUrl) return null;

  return (
    <div className="absolute inset-0">
      <iframe
        key={videoUrl}
        src={videoUrl}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
};

export default VideoPlayer;
