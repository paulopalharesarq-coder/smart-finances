/**
 * Minhas Compras - PWA Local Network Server
 * Zero-dependency Node.js HTTP server with auto IP detection, QR Code and MIME support.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function getLocalIPAddresses() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

// Generate simple ASCII terminal QR code representation
function printTerminalBanner(localUrls) {
  console.log('='.repeat(58));
  console.log('  💰 SMART FINANCES • CONTROLE FINANCEIRO PESSOAL (PWA)');
  console.log('='.repeat(58));
  console.log('\n  ⚡ Servidor local iniciado com sucesso!\n');
  console.log(`  🖥️  No seu Computador:   http://localhost:${PORT}`);
  
  localUrls.forEach(item => {
    console.log(`  📱  No seu Celular (Wi-Fi): http://${item.address}:${PORT}`);
  });

  console.log('\n' + '-'.repeat(58));
  console.log('  💡 DICAS PARA ABRIR NO TELEFONE:');
  console.log('  1. Conecte o celular na mesma rede Wi-Fi deste computador.');
  console.log(`  2. Abra o Chrome ou Safari no celular e digite: http://${localUrls[0]?.address || '192.168.1.2'}:${PORT}`);
  console.log('  3. No Android: Toque em "Instalar aplicativo" ou nos 3 pontinhos.');
  console.log('  4. No iPhone: Toque em Compartilhar ➔ "Adicionar à Tela de Início".');
  console.log('='.repeat(58) + '\n');
}

const server = http.createServer((req, res) => {
  // Network Info API Endpoint
  if (req.url === '/api/network-info') {
    const ips = getLocalIPAddresses();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      port: PORT,
      primaryIP: ips[0]?.address || '127.0.0.1',
      interfaces: ips,
      fullUrl: `http://${ips[0]?.address || '127.0.0.1'}:${PORT}`
    }));
    return;
  }

  // Normalize URL to file path
  let safePath = req.url.split('?')[0].split('#')[0];
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, safePath);

  // Security check: ensure within root directory
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: serve index.html for navigation requests
      const indexPath = path.join(ROOT_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, content) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Set caching headers for PWA assets
    const headers = { 'Content-Type': contentType };
    if (ext === '.webmanifest' || ext === '.json' || safePath.includes('sw.js')) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    res.writeHead(200, headers);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPAddresses();
  printTerminalBanner(ips);
});
