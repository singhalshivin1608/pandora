import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '../db';
import { getUserTopTracks, getRecentlyPlayed, searchTrack } from './spotify';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function generateRecommendation(userId: number): Promise<any> {
  const db = getDb();

  const prefs = db.prepare('SELECT languages, genres FROM preferences WHERE user_id = ?').get(userId) as any;
  const languages: string[] = prefs ? JSON.parse(prefs.languages) : ['English'];
  const genres: string[] = prefs ? JSON.parse(prefs.genres) : [];

  let topTracks: any[] = [];
  let recentTracks: any[] = [];

  try {
    topTracks = await getUserTopTracks(userId);
    recentTracks = await getRecentlyPlayed(userId);
  } catch (err) {
    console.error('Error fetching Spotify data:', err);
  }

  const feedbackRows = db.prepare(`
    SELECT track_name, artist_name, feedback FROM recommendations
    WHERE user_id = ? AND feedback IS NOT NULL
    ORDER BY generated_at DESC LIMIT 20
  `).all(userId) as any[];

  const liked = feedbackRows.filter(r => r.feedback === 'liked').map(r => `${r.track_name} by ${r.artist_name}`);
  const disliked = feedbackRows.filter(r => r.feedback === 'disliked').map(r => `${r.track_name} by ${r.artist_name}`);

  const recentRecs = db.prepare(`
    SELECT track_name, artist_name FROM recommendations
    WHERE user_id = ? ORDER BY generated_at DESC LIMIT 10
  `).all(userId) as any[];

  const recentRecsList = recentRecs.map(r => `${r.track_name} by ${r.artist_name}`);

  const prompt = `You are a music recommendation expert with deep knowledge of global music across all genres and eras. Based on the user's listening history and preferences, recommend ONE song they would love.

User preferences:
- Languages: ${languages.join(', ')}
- Genres (optional preference): ${genres.length > 0 ? genres.join(', ') : 'None specified - be creative'}

Recently listened tracks (last 50):
${recentTracks.slice(0, 20).map(t => `- ${t.name} by ${t.artist}`).join('\n') || 'No recent history'}

Top tracks (all time favorites):
${topTracks.map(t => `- ${t.name} by ${t.artist} (Album: ${t.album})`).join('\n') || 'No top tracks data'}

Previous recommendations feedback:
- Liked: ${liked.length > 0 ? liked.join(', ') : 'None yet'}
- Disliked: ${disliked.length > 0 ? disliked.join(', ') : 'None yet'}

Recently recommended (avoid these): ${recentRecsList.length > 0 ? recentRecsList.join(', ') : 'None'}

Rules:
1. Recommend a song NOT in the recently recommended list
2. The song MUST be in one of the user's preferred languages: ${languages.join(', ')}
3. If genres are specified, try to match them
4. Reference a SPECIFIC song from their listening history to explain why you're recommending this
5. The song MUST be available on Spotify
6. Be diverse - don't always pick mainstream hits
7. Consider hidden gems and trending tracks
8. Return ONLY valid JSON, no other text, no markdown code blocks

Return this exact JSON structure:
{
  "spotify_search_query": "song name artist name",
  "track_name": "exact track name",
  "artist_name": "exact artist name",
  "recommendation_text": {
    "history": "2-3 engaging sentences about the song's history, the artist's background, and what makes this song special",
    "is_trending": false,
    "trending_explanation": "why this song is trending right now, or empty string if not trending",
    "is_hidden_gem": true,
    "hidden_gem_explanation": "why this is a hidden gem that deserves more attention, or empty string if not a hidden gem",
    "why_recommended": "Because you liked [specific song from their history]... explain the connection in 1-2 sentences"
  }
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');

  let claudeResponse: any;
  try {
    const text = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    claudeResponse = JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse Claude response:', content.text);
    throw new Error('Failed to parse AI recommendation');
  }

  const trackInfo = await searchTrack(userId, claudeResponse.spotify_search_query);

  const now = Math.floor(Date.now() / 1000);
  const validUntil = now + 24 * 60 * 60;

  const recommendationJson = JSON.stringify(claudeResponse.recommendation_text);

  const result = db.prepare(`
    INSERT INTO recommendations (
      user_id, spotify_track_id, track_name, artist_name, album_name,
      spotify_url, preview_url, album_art_url, recommendation_json, valid_until
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    trackInfo?.spotify_track_id || null,
    trackInfo?.track_name || claudeResponse.track_name,
    trackInfo?.artist_name || claudeResponse.artist_name,
    trackInfo?.album_name || null,
    trackInfo?.spotify_url || null,
    trackInfo?.preview_url || null,
    trackInfo?.album_art_url || null,
    recommendationJson,
    validUntil,
  );

  return {
    id: result.lastInsertRowid,
    user_id: userId,
    spotify_track_id: trackInfo?.spotify_track_id || null,
    track_name: trackInfo?.track_name || claudeResponse.track_name,
    artist_name: trackInfo?.artist_name || claudeResponse.artist_name,
    album_name: trackInfo?.album_name || null,
    spotify_url: trackInfo?.spotify_url || null,
    preview_url: trackInfo?.preview_url || null,
    album_art_url: trackInfo?.album_art_url || null,
    recommendation_json: claudeResponse.recommendation_text,
    generated_at: now,
    valid_until: validUntil,
    feedback: null,
  };
}
