import { BackendApiResponse } from '../../imported-player/types/api';

const JELLY_BASE_URL = 'https://jelly.up.railway.app/v1';

export async function fetchMovieData(tmdbId: number): Promise<BackendApiResponse | null> {
  try {
    const response = await fetch(`${JELLY_BASE_URL}/movies/${tmdbId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch movie data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching movie from Jelly:', error);
    return null;
  }
}

export async function fetchTVData(
  tmdbId: number,
  season: number,
  episode: number
): Promise<BackendApiResponse | null> {
  try {
    const response = await fetch(
      `${JELLY_BASE_URL}/tv/${tmdbId}/seasons/${season}/episodes/${episode}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch TV data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching TV episode from Jelly:', error);
    return null;
  }
}
