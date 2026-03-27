const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Database ───
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'calendar.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_data (
    project_id  TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    payload     TEXT NOT NULL,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Prepared statements ───
const stmts = {
  listProjects:   db.prepare(`SELECT id, name, created_at as createdAt, updated_at as updatedAt FROM projects ORDER BY updated_at DESC`),
  getProject:     db.prepare(`SELECT id, name, created_at as createdAt, updated_at as updatedAt FROM projects WHERE id = ?`),
  createProject:  db.prepare(`INSERT INTO projects (id, name) VALUES (?, ?)`),
  renameProject:  db.prepare(`UPDATE projects SET name = ?, updated_at = datetime('now') WHERE id = ?`),
  deleteProject:  db.prepare(`DELETE FROM projects WHERE id = ?`),
  getData:        db.prepare(`SELECT payload FROM project_data WHERE project_id = ?`),
  upsertData:     db.prepare(`
    INSERT INTO project_data (project_id, payload, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(project_id) DO UPDATE SET payload = excluded.payload, updated_at = datetime('now')
  `),
  touchProject:   db.prepare(`UPDATE projects SET updated_at = datetime('now') WHERE id = ?`),
};

// ─── Helper ───
function newId() {
  return 'p' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
}

// ━━━━━━━━━━━━━━━━━━━━━━ API ROUTES ━━━━━━━━━━━━━━━━━━━━━━

// List all projects
app.get('/api/projects', (req, res) => {
  const rows = stmts.listProjects.all();
  res.json(rows);
});

// Create a project
app.post('/api/projects', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
  const id = newId();
  stmts.createProject.run(id, name.trim());
  const project = stmts.getProject.get(id);
  res.status(201).json(project);
});

// Rename a project
app.patch('/api/projects/:id', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
  const info = stmts.renameProject.run(name.trim(), req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json(stmts.getProject.get(req.params.id));
});

// Delete a project
app.delete('/api/projects/:id', (req, res) => {
  stmts.deleteProject.run(req.params.id);
  res.status(204).end();
});

// Get project calendar data
app.get('/api/projects/:id/data', (req, res) => {
  const row = stmts.getData.get(req.params.id);
  if (!row) return res.json(null);
  try { res.json(JSON.parse(row.payload)); }
  catch { res.json(null); }
});

// Save project calendar data
app.put('/api/projects/:id/data', (req, res) => {
  const proj = stmts.getProject.get(req.params.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });
  const payload = JSON.stringify(req.body);
  stmts.upsertData.run(req.params.id, payload);
  stmts.touchProject.run(req.params.id);
  res.json({ ok: true });
});

// ─── Catch-all: serve index.html for SPA ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ───
app.listen(PORT, () => {
  console.log(`\n  ✦  Payette Calendar running at http://localhost:${PORT}\n`);
});
