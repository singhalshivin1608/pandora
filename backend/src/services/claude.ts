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

  const now24h = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  const heardRows = db.prepare(`
    SELECT track_name, artist_name, recommendation_json FROM recommendations
    WHERE user_id = ? AND feedback = 'heard' AND generated_at > ?
    ORDER BY generated_at DESC LIMIT 10
  `).all(userId, now24h) as any[];
  const heardRecently = heardRows.map(r => `${r.track_name} by ${r.artist_name}`);

  const recentRecs = db.prepare(`
    SELECT track_name, artist_name FROM recommendations
    WHERE user_id = ? ORDER BY generated_at DESC LIMIT 15
  `).all(userId) as any[];

  const recentRecsList = recentRecs.map(r => `${r.track_name} by ${r.artist_name}`);

  const prompt = `You are a music archaeologist and underground music expert. Your mission is to surface songs the user has NEVER heard — deep cuts, overlooked artists, regional hits, cult classics, and underground gems. You have encyclopedic knowledge of global music from every era and corner of the world.

User preferences:
- Languages: ${languages.join(', ')}
- Genres (optional preference): ${genres.length > 0 ? genres.join(', ') : 'None specified - explore everything'}

Recently listened tracks (for taste reference only — do NOT recommend these or similar mainstream hits):
${recentTracks.slice(0, 20).map(t => `- ${t.name} by ${t.artist}`).join('\n') || 'No recent history'}

Top tracks (all time favorites — use for taste clues, avoid recommending similar-tier popular songs):
${topTracks.map(t => `- ${t.name} by ${t.artist} (Album: ${t.album})`).join('\n') || 'No top tracks data'}

Previous recommendations feedback:
- Loved: ${liked.length > 0 ? liked.join(', ') : 'None yet'}
- Disliked: ${disliked.length > 0 ? disliked.join(', ') : 'None yet'}
- Already knew these (heard recently — avoid similar genres/styles for now): ${heardRecently.length > 0 ? heardRecently.join(', ') : 'None'}

Avoid recommending any of these (already shown): ${recentRecsList.length > 0 ? recentRecsList.join(', ') : 'None'}

STRICT RULES:
1. NEVER recommend songs the user already knows — if it's in their listening history, it's off limits
2. NEVER recommend artists from the top 50 global Spotify charts or Billboard Hot 100 regulars
3. NEVER recommend songs with over 500 million Spotify streams unless they are genuinely obscure in the user's region
4. The song MUST be in one of the user's preferred languages: ${languages.join(', ')}
5. If the user has heard songs recently, avoid that genre style for variety
6. Prioritize: underground artists, regional stars unknown outside their home country, cult albums with small but devoted fanbases, forgotten hits from past decades, artists with under 1 million monthly Spotify listeners
7. The song MUST be on Spotify
8. Reference a SPECIFIC song from their listening history to explain the taste connection
9. Return ONLY valid JSON, no other text, no markdown code blocks
10. Think deeply — don't default to the first obvious answer. Ask yourself: "Would a casual music fan already know this?" If yes, pick something else.

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
