import { Router, Request, Response } from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import { getDb } from '../db';

const router = Router();

const scopes = [
  'user-read-recently-played',
  'user-top-read',
  'user-read-email',
  'user-read-private',
];

function createSpotifyApi() {
  return new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  });
}

router.get('/spotify', (req: Request, res: Response) => {
  const spotifyApi = createSpotifyApi();
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');
  res.redirect(authorizeURL);
});

router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code || typeof code !== 'string') {
    res.redirect(`${FRONTEND_URL}?error=no_code`);
    return;
  }

  try {
    const spotifyApi = createSpotifyApi();
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    const meData = await spotifyApi.getMe();
    const { id: spotify_id, display_name, email } = meData.body;

    const db = getDb();
    const tokenExpiresAt = Math.floor(Date.now() / 1000) + expires_in;

    const existing = db.prepare('SELECT id FROM users WHERE spotify_id = ?').get(spotify_id) as { id: number } | undefined;

    let userId: number;
    if (existing) {
      db.prepare(`
        UPDATE users SET access_token = ?, refresh_token = ?, token_expires_at = ?, display_name = ?, email = ?
        WHERE spotify_id = ?
      `).run(access_token, refresh_token, tokenExpiresAt, display_name || null, email || null, spotify_id);
      userId = existing.id;
    } else {
      const result = db.prepare(`
        INSERT INTO users (spotify_id, display_name, email, access_token, refresh_token, token_expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(spotify_id, display_name || null, email || null, access_token, refresh_token, tokenExpiresAt);
      userId = result.lastInsertRowid as number;
    }

    (req.session as any).userId = userId;
    req.session.save(() => {
      res.redirect(FRONTEND_URL);
    });
  } catch (err) {
    console.error('Auth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
});

router.get('/me', (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT spotify_id, display_name, email FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  res.json(user);
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
