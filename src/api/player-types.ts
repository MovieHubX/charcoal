export interface BackendSource {
  url: string;
  type: "mp4" | "hls" | "mkv";
  quality: string;
  audioTracks?: Array<{
    language: string;
    label: string;
  }>;
  provider: {
    id: string;
    name: string;
  };
}

export interface BackendSubtitle {
  url: string;
  format: "vtt" | "srt";
  label: string;
}

export interface BackendApiResponse {
  responseId: string;
  expiresAt: string;
  sources: BackendSource[];
  subtitles: BackendSubtitle[];
}
