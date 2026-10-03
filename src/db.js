const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

function createDb(file = process.env.DB_FILE || ':memory:') {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'database', 'bd.sql'), 'utf8'));
  return db;
}
module.exports = { createDb };
