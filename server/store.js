// Persistence for users and saved people, on SQLite via Node's built-in
// `node:sqlite` (no native dependency to compile). The DB file lives under
// DATA_DIR — point that at a mounted persistent disk in production so accounts
// survive redeploys. Requires Node >= 22.5.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "astroman.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE COLLATE NOCASE,
    salt       TEXT NOT NULL,
    hash       TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS people (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    name       TEXT NOT NULL,
    year INTEGER, month INTEGER, day INTEGER, hour INTEGER, minute INTEGER,
    lat REAL, lon REAL, tz REAL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_people_user ON people(user_id);
`);

const users = {
  findByUsername: u =>
    db.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(String(u)),
  findById: id => db.prepare("SELECT * FROM users WHERE id = ?").get(id),
  add(user) {
    db.prepare(
      "INSERT INTO users (id, username, salt, hash, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(user.id, user.username, user.salt, user.hash, user.createdAt);
    return user;
  }
};

const people = {
  forUser: userId =>
    db.prepare("SELECT * FROM people WHERE user_id = ? ORDER BY name COLLATE NOCASE").all(userId),
  add(person) {
    db.prepare(
      `INSERT INTO people (id, user_id, name, year, month, day, hour, minute, lat, lon, tz, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      person.id, person.userId, person.name, person.year, person.month, person.day,
      person.hour, person.minute, person.lat, person.lon, person.tz, person.createdAt
    );
    return person;
  },
  remove(userId, id) {
    const info = db.prepare("DELETE FROM people WHERE id = ? AND user_id = ?").run(id, userId);
    return info.changes > 0;
  }
};

module.exports = { users, people };
