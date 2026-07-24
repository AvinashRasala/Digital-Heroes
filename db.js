// db.js — SQLite data layer for LeadDesk Mini
// Uses Node's built-in node:sqlite (no native build step, no external DB service needed).
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'leaddesk.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    budget_range TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','Contacted','Closed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
`);

module.exports = db;
