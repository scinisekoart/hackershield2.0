const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'leaderboard.json');
const defaultAllowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://'];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultAllowedOrigins.join(','))
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

function ensureDataFile() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readLeaderboard() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to read leaderboard data:', error.message);
    return [];
  }
}

function writeLeaderboard(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

function sanitizeName(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30) || 'Player';
}

function validateScoreData(body) {
  const score = Number(body.score);
  const total = Number(body.total);
  const time = Number(body.time);
  const percentage = Number(body.percentage);

  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) {
    return false;
  }

  if (!Number.isFinite(time) || time < 0) {
    return false;
  }

  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    return false;
  }

  if (typeof body.name !== 'string') {
    return false;
  }

  return true;
}

ensureDataFile();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginResourcePolicy: { policy: 'same-origin' }
}));

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.options('*', cors());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.get('/api/leaderboard', (req, res) => {
  const leaderboard = readLeaderboard()
    .slice(0, 10)
    .map((entry) => ({
      name: sanitizeName(entry.name),
      score: Number(entry.score),
      total: Number(entry.total),
      percentage: Number(entry.percentage),
      time: Number(entry.time)
    }));

  res.json({ leaderboard });
});

app.post('/api/score', (req, res) => {
  const body = req.body || {};

  if (!validateScoreData(body)) {
    return res.status(400).json({ error: 'Invalid score payload.' });
  }

  const cleaned = {
    name: sanitizeName(body.name),
    score: Number(body.score),
    total: Number(body.total),
    percentage: Number(body.percentage),
    time: Number(body.time),
    date: new Date().toISOString()
  };

  const leaderboard = readLeaderboard();
  leaderboard.push(cleaned);
  leaderboard.sort((a, b) => {
    if (Math.abs(Number(b.percentage) - Number(a.percentage)) < 0.01) {
      return Number(a.time) - Number(b.time);
    }
    return Number(b.percentage) - Number(a.percentage);
  });

  writeLeaderboard(leaderboard.slice(0, 50));

  return res.status(200).json({
    ok: true,
    saved: cleaned,
    leaderboard: leaderboard.slice(0, 10)
  });
});

app.use((error, req, res, next) => {
  if (error && error.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (error && error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }

  console.error('Unhandled error:', error);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Secure quiz backend running on http://localhost:${PORT}`);
});
