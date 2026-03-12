// Simple static file server using Node.js built-in modules
// Run with: node serve-static.js
// Then open http://localhost:3000 in Edge

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  // Default to index.html for root
  let filePath = req.url === '/' 
    ? path.join(PUBLIC_DIR, 'index.html')
    : path.join(PUBLIC_DIR, req.url);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Static server running at http://localhost:${PORT}`);
  console.log(`📂 Serving files from: ${PUBLIC_DIR}`);
  console.log('\nAvailable pages:');
  console.log(`  - http://localhost:${PORT}/ (index.html)`);
  console.log(`  - http://localhost:${PORT}/GhostR.html`);
  console.log(`  - http://localhost:${PORT}/inscri.html`);
  console.log(`  - http://localhost:${PORT}/connec.html`);
  console.log(`  - http://localhost:${PORT}/deposit.html`);
  console.log(`  - http://localhost:${PORT}/withdraw.html`);
});
