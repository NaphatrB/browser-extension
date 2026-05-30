/**
 * Minimal static file server for the built extension directory.
 * Serves `extension/` at http://localhost:7777 for Playwright E2E tests.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_DIR = path.resolve(__dirname, '../../extension');
const PORT = 7777;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url?.split('?')[0] ?? '/';
  const filePath = path.join(EXTENSION_DIR, urlPath);

  // Prevent directory traversal
  if (!filePath.startsWith(EXTENSION_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const serve = (fp) => {
    if (!fs.existsSync(fp)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      return serve(path.join(fp, 'index.html'));
    }
    const ext = path.extname(fp);
    res.writeHead(200, {
      'Content-Type': MIME[ext] ?? 'text/plain',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(fp).pipe(res);
  };

  serve(filePath);
});

server.listen(PORT, () => {
  console.log(`Extension test server running at http://localhost:${PORT}`);
});
