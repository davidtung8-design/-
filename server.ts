import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory store for temporary ICS files
  const calendarStore = new Map<string, { content: string; expiry: number }>();

  // Cleanup old entries
  setInterval(() => {
    const now = Date.now();
    for (const [id, data] of calendarStore.entries()) {
      if (now > data.expiry) {
        calendarStore.delete(id);
      }
    }
  }, 60000);

  // API: Prepare Calendar
  app.post('/api/calendar/prepare', (req, res) => {
    const { icsContent } = req.body;
    console.log('--- Calendar Prepare Request ---');
    if (!icsContent) {
      console.error('Failure: Missing icsContent in request body');
      return res.status(400).json({ error: 'Missing content' });
    }

    const id = Math.random().toString(36).substring(2, 15);
    calendarStore.set(id, {
      content: icsContent,
      expiry: Date.now() + 300000 // 5 minutes
    });

    console.log(`Success: Stored calendar data with ID: ${id}`);
    res.json({ id });
  });

  // API: Download Calendar
  app.get('/api/calendar/download/:id.ics', (req, res) => {
    const { id } = req.params;
    console.log(`--- Calendar Download Request: ${id} ---`);
    const data = calendarStore.get(id);

    if (!data) {
      console.error(`Failure: Calendar ID ${id} not found or expired`);
      return res.status(404).send('Calendar file expired or not found.');
    }

    console.log(`Success: Serving file for ID: ${id}`);
    res.setHeader('Content-Type', 'text/calendar;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="david_tung_matrix.ics"`);
    res.send(data.content);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
