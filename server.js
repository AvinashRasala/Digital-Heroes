// server.js — LeadDesk Mini
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8,
    sameSite: 'lax'
  }
}));

// ---------- Validation helpers ----------
const BUDGET_RANGES = ['<$1k', '$1k-$5k', '$5k-$20k', '$20k+'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLead(body) {
  const errors = {};

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const budget_range = (body.budget_range || '').trim();
  const message = (body.message || '').trim();

  if (name.length < 2)
    errors.name = 'Name must be at least 2 characters.';

  if (!EMAIL_RE.test(email))
    errors.email = 'Enter a valid email address.';

  if (!BUDGET_RANGES.includes(budget_range))
    errors.budget_range = 'Choose a valid budget range.';

  if (message.length > 2000)
    errors.message = 'Message is too long (max 2000 characters).';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    clean: {
      name,
      email,
      budget_range,
      message
    }
  };
}

// ---------- Auth middleware ----------
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.status(401).json({ error: 'Not authenticated.' });
}

// ---------- Public API ----------
app.post('/api/leads', (req, res) => {
  const { valid, errors, clean } = validateLead(req.body);

  if (!valid) {
    return res.status(400).json({ errors });
  }

  const stmt = db.prepare(
    'INSERT INTO leads (name,email,budget_range,message) VALUES (?,?,?,?)'
  );

  const info = stmt.run(
    clean.name,
    clean.email,
    clean.budget_range,
    clean.message
  );

  res.status(201).json({
    id: Number(info.lastInsertRowid)
  });
});

// ---------- Admin Setup ----------
app.post('/api/setup-admin', (req, res) => {
  const { secret } = req.body || {};

  if (
    !process.env.SETUP_SECRET ||
    secret !== process.env.SETUP_SECRET
  ) {
    return res.status(403).json({
      error: 'Forbidden.'
    });
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return res.status(400).json({
      error: 'ADMIN_USERNAME / ADMIN_PASSWORD not set.'
    });
  }

  const existing = db
    .prepare('SELECT id FROM admins WHERE username=?')
    .get(username);

  if (existing) {
    return res.json({
      ok: true,
      message: 'Admin already exists.'
    });
  }

  const hash = bcrypt.hashSync(password, 10);

  db.prepare(
    'INSERT INTO admins(username,password_hash) VALUES(?,?)'
  ).run(username, hash);

  res.json({
    ok: true,
    message: 'Admin created.'
  });
});

// ---------- Login ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      error: 'Username and password required.'
    });
  }

  const admin = db
    .prepare('SELECT * FROM admins WHERE username=?')
    .get(username);

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({
      error: 'Invalid credentials.'
    });
  }

  req.session.adminId = admin.id;
  req.session.username = admin.username;

  res.json({
    ok: true,
    username: admin.username
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/session', (req, res) => {
  res.json({
    loggedIn: !!(req.session && req.session.adminId),
    username: req.session?.username || null
  });
});

// ---------- Admin API ----------

// Get Leads
app.get('/api/admin/leads', requireAuth, (req, res) => {
  const q = (req.query.q || '').trim();

  let rows;

  if (q) {
    const like = `%${q}%`;

    rows = db.prepare(`
      SELECT *
      FROM leads
      WHERE name LIKE ?
      OR email LIKE ?
      OR message LIKE ?
      ORDER BY created_at DESC
    `).all(like, like, like);

  } else {

    rows = db.prepare(
      'SELECT * FROM leads ORDER BY created_at DESC'
    ).all();

  }

  res.json(rows);
});

// Update Status
app.patch('/api/admin/leads/:id/status', requireAuth, (req, res) => {

  const { status } = req.body;

  const allowed = ['New', 'Contacted', 'Closed'];

  if (!allowed.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status.'
    });
  }

  const id = Number(req.params.id);

  const result = db.prepare(
    'UPDATE leads SET status=? WHERE id=?'
  ).run(status, id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: 'Lead not found.'
    });
  }

  res.json({
    ok: true
  });

});

// Delete Lead
app.delete('/api/admin/leads/:id', requireAuth, (req, res) => {

  const id = Number(req.params.id);

  const result = db.prepare(
    'DELETE FROM leads WHERE id=?'
  ).run(id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: 'Lead not found.'
    });
  }

  res.json({
    ok: true
  });

});

// ---------- Admin Page ----------
app.get('/admin', (req, res) => {

  if (req.session && req.session.adminId) {

    res.sendFile(
      path.join(__dirname, 'public/admin/dashboard.html')
    );

  } else {

    res.redirect('/admin/login.html');

  }

});

app.use(
  '/admin',
  express.static(path.join(__dirname, 'public/admin'))
);

app.listen(PORT, () => {
  console.log(`LeadDesk Mini running on http://localhost:${PORT}`);
});