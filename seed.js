// seed.js — creates the admin account. Run once: `node seed.js`
// Reads credentials from .env so nothing is hardcoded in source.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error('Set ADMIN_USERNAME and ADMIN_PASSWORD in your .env file first.');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
if (existing) {
  console.log(`Admin "${username}" already exists. Delete it from the DB first if you want to reseed.`);
  process.exit(0);
}

const hash = bcrypt.hashSync(password, 10);
db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash);
console.log(`Admin account "${username}" created.`);
