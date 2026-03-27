# Payette Space Strategy Calendar

A collaborative project calendar tool with persistent server-side storage. Multiple users can view and edit the same calendar through shared URLs.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3000
```

The server runs on port 3000 by default. Set the `PORT` environment variable to change it:

```bash
PORT=8080 npm start
```

## How It Works

- **Backend**: Node.js + Express + SQLite (via better-sqlite3)
- **Frontend**: Vanilla HTML/CSS/JS (no build step)
- **Database**: Single `calendar.db` file, created automatically on first run
- **Storage**: All project data is saved to the server — everyone sharing the same URL sees the same data

## Features

- Create multiple independent project calendars
- Drag & drop project icons onto calendar days
- Custom holidays/breaks that fill entire cells
- Color-customizable legend items
- Export calendar as PNG
- Copy URL to share with teammates — they see the same data
- Auto-saves every change to the server (400ms debounce)

## Deploying

### Option A: Any Node.js host (Railway, Render, Fly.io, VPS)

```bash
npm install
npm start
```

Make sure the filesystem is persistent (for the SQLite file). On Railway/Render, attach a persistent volume.

### Option B: Docker

```bash
docker build -t payette-calendar .
docker run -p 3000:3000 -v payette-data:/app/data payette-calendar
```

### Option C: Simple VPS (Ubuntu)

```bash
# On your server
git clone <your-repo>
cd payette-calendar
npm install
# Use pm2 to keep it running
npx pm2 start server.js --name payette
npx pm2 save
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project `{name}` |
| PATCH | `/api/projects/:id` | Rename project `{name}` |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/data` | Get calendar data |
| PUT | `/api/projects/:id/data` | Save calendar data |

## File Structure

```
payette-calendar/
├── server.js          # Express + SQLite backend
├── package.json
├── Dockerfile
├── README.md
└── public/
    └── index.html     # Full frontend (single file)
```
