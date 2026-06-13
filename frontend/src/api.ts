import axios from 'axios';

const api = axios.create({
  withCredentials: true,
});

export interface User {
  spotify_id: string;
  display_name: string | null;
  email: string | null;
}

export interface Preferences {
  languages: string[];
  genres: string[];
}

export interface RecommendationText {
  history: string;
  is_trending: boolean;
  trending_explanation: string;
  is_hidden_gem: boolean;
  hidden_gem_explanation: string;
  why_recommended: string;
}

export interface Recommendation {
  id: number;
  user_id: number;
  spotify_track_id: string | null;
  track_name: string;
  artist_name: string;
  album_name: string | null;
  spotify_url: string | null;
  preview_url: string | null;
  album_art_url: string | null;
  recommendation_json: RecommendationText;
  generated_at: number;
  valid_until: number;
  feedback: string | null;
}

export const authApi = {
  getMe: () => api.get<User>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const preferencesApi = {
  get: () => api.get<Preferences>('/api/preferences'),
  save: (prefs: Preferences) => api.post<{ success: boolean }>('/api/preferences', prefs),
};

export const recommendationApi = {
  getToday: () => api.get<Recommendation>('/api/recommendation/today'),
  submitFeedback: (id: number, feedback: 'liked' | 'disliked') =>
    api.post(`/api/recommendation/${id}/feedback`, { feedback }),
  getNext: () => api.post<Recommendation>('/api/recommendation/next'),
};
