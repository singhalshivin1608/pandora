import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import ConnectSQLite3 from 'connect-sqlite3';
import path from 'path';
import authRouter from './routes/auth';
import preferencesRouter from './routes/preferences';
import recommendationsRouter from './routes/recommendations';

const SQLiteStore = ConnectSQLite3(session);

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(session({
  store: new (SQLiteStore as any)({
    db: 'sessions.db',
    dir: path.join(__dirname, '../..'),
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

app.use('/auth', authRouter);
app.use('/api/preferences', requireAuth, preferencesRouter);
app.use('/api/recommendation', requireAuth, recommendationsRouter);

app.listen(PORT, () => {
  console.log(`Pandora backend running on http://localhost:${PORT}`);
});

export default app;
