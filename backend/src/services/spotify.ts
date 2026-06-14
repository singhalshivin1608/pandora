import SpotifyWebApi from 'spotify-web-api-node';
import { getDb } from '../db';

interface UserRow {
  id: number;
  access_token: string;
  refresh_token: string;
  token_expires_at: number;
}

async function getSpotifyApiForUser(userId: number): Promise<SpotifyWebApi> {
  const db = getDb();
  const user = db.prepare('SELECT id, access_token, refresh_token, token_expires_at FROM users WHERE id = ?').get(userId) as UserRow | undefined;

  if (!user) throw new Error('User not found');

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  });

  const now = Math.floor(Date.now() / 1000);
  if (user.token_expires_at < now + 60) {
    spotifyApi.setRefreshToken(user.refresh_token);
    const data = await spotifyApi.refreshAccessToken();
    const { access_token, expires_in } = data.body;
    const newExpiry = now + expires_in;
    db.prepare('UPDATE users SET access_token = ?, token_expires_at = ? WHERE id = ?').run(access_token, newExpiry, userId);
    spotifyApi.setAccessToken(access_token);
  } else {
    spotifyApi.setAccessToken(user.access_token);
    spotifyApi.setRefreshToken(user.refresh_token);
  }

  return spotifyApi;
}

export async function getUserTopTracks(userId: number): Promise<any[]> {
  const api = await getSpotifyApiForUser(userId);
  const result = await api.getMyTopTracks({ limit: 20, time_range: 'medium_term' });
  return result.body.items.map(t => ({
    id: t.id,
    name: t.name,
    artist: t.artists.map((a: any) => a.name).join(', '),
    album: t.album.name,
  }));
}

export async function getRecentlyPlayed(userId: number): Promise<any[]> {
  const api = await getSpotifyApiForUser(userId);
  const result = await api.getMyRecentlyPlayedTracks({ limit: 50 });
  return result.body.items.map((item: any) => ({
    id: item.track.id,
    name: item.track.name,
    artist: item.track.artists.map((a: any) => a.name).join(', '),
    played_at: item.played_at,
  }));
}

export async function searchTrack(userId: number, query: string, trackName?: string, artistName?: string): Promise<any | null> {
  const api = await getSpotifyApiForUser(userId);

  // Try exact field search first for better accuracy
  if (trackName && artistName) {
    const exactQuery = `track:${trackName} artist:${artistName}`;
    const exactResult = await api.searchTracks(exactQuery, { limit: 5 });
    const exactTracks = exactResult.body.tracks?.items;
    if (exactTracks && exactTracks.length > 0) {
      // Pick the result whose names most closely match
      const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetTrack = normalise(trackName);
      const targetArtist = normalise(artistName);
      const best = exactTracks.find(t =>
        normalise(t.name).includes(targetTrack) &&
        t.artists.some((a: any) => normalise(a.name).includes(targetArtist) || targetArtist.includes(normalise(a.name)))
      ) || exactTracks[0];

      return {
        spotify_track_id: best.id,
        track_name: best.name,
        artist_name: best.artists.map((a: any) => a.name).join(', '),
        album_name: best.album.name,
        spotify_url: best.external_urls.spotify,
        preview_url: best.preview_url || null,
        album_art_url: best.album.images[0]?.url || null,
      };
    }
  }

  // Fallback to general query
  const result = await api.searchTracks(query, { limit: 1 });
  const tracks = result.body.tracks?.items;
  if (!tracks || tracks.length === 0) return null;

  const track = tracks[0];
  return {
    spotify_track_id: track.id,
    track_name: track.name,
    artist_name: track.artists.map((a: any) => a.name).join(', '),
    album_name: track.album.name,
    spotify_url: track.external_urls.spotify,
    preview_url: track.preview_url || null,
    album_art_url: track.album.images[0]?.url || null,
  };
}

export async function refreshUserToken(userId: number): Promise<void> {
  await getSpotifyApiForUser(userId);
}
