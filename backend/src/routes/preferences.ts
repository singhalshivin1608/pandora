import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const db = getDb();

  const prefs = db.prepare('SELECT languages, genres FROM preferences WHERE user_id = ?').get(userId) as any;

  if (!prefs) {
    res.json({ languages: [], genres: [] });
    return;
  }

  res.json({
    languages: JSON.parse(prefs.languages),
    genres: JSON.parse(prefs.genres),
  });
});

router.post('/', (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const { languages, genres } = req.body;

  if (!Array.isArray(languages) || languages.length === 0) {
    res.status(400).json({ error: 'At least one language is required' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM preferences WHERE user_id = ?').get(userId);

  if (existing) {
    db.prepare(`
      UPDATE preferences SET languages = ?, genres = ?, updated_at = unixepoch()
      WHERE user_id = ?
    `).run(JSON.stringify(languages), JSON.stringify(genres || []), userId);
  } else {
    db.prepare(`
      INSERT INTO preferences (user_id, languages, genres)
      VALUES (?, ?, ?)
    `).run(userId, JSON.stringify(languages), JSON.stringify(genres || []));
  }

  res.json({ success: true });
});

export default router;
