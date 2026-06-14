import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { generateRecommendation } from '../services/claude';

const router = Router();

router.get('/today', async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const existing = db.prepare(`
    SELECT * FROM recommendations
    WHERE user_id = ? AND valid_until > ? AND (feedback IS NULL OR feedback = 'liked')
    ORDER BY generated_at DESC LIMIT 1
  `).get(userId, now) as any;

  if (existing) {
    res.json({
      ...existing,
      recommendation_json: JSON.parse(existing.recommendation_json),
    });
    return;
  }

  try {
    const rec = await generateRecommendation(userId);
    res.json(rec);
  } catch (err: any) {
    console.error('Error generating recommendation:', err);
    res.status(500).json({ error: err.message || 'Failed to generate recommendation' });
  }
});

router.post('/:id/feedback', (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const { id } = req.params;
  const { feedback } = req.body;

  if (!['liked', 'disliked', 'heard'].includes(feedback)) {
    res.status(400).json({ error: 'Invalid feedback value' });
    return;
  }

  const db = getDb();
  db.prepare(`
    UPDATE recommendations SET feedback = ? WHERE id = ? AND user_id = ?
  `).run(feedback, id, userId);

  res.json({ success: true });
});

router.post('/next', async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;

  try {
    const rec = await generateRecommendation(userId);
    res.json(rec);
  } catch (err: any) {
    console.error('Error generating next recommendation:', err);
    res.status(500).json({ error: err.message || 'Failed to generate recommendation' });
  }
});

export default router;
