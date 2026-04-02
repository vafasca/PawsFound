const http = require('http');
const { execSync } = require('child_process');

// Keep-alive HTTP server on port 3000 that proxies to Next.js
const NEXT_PORT = 3001;
const PORT = 3000;

// Start Next.js on alternate port
const nextProcess = require('child_process').spawn('node', ['.next/standalone/server.js'], {
  env: { ...process.env, PORT: String(NEXT_PORT) },
  stdio: ['pipe', 'pipe', 'pipe']
});

nextProcess.stdout.on('data', d => process.stdout.write(d));
nextProcess.stderr.on('data', d => process.stderr.write(d));

nextProcess.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}, restarting...`);
  const p2 = require('child_process').spawn('node', ['.next/standalone/server.js'], {
    env: { ...process.env, PORT: String(NEXT_PORT) },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  p2.stdout.on('data', d => process.stdout.write(d));
  p2.stderr.on('data', d => process.stderr.write(d));
  p2.on('exit', () => console.log('Second instance also died'));
});

// Simple proxy
const server = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxy.on('error', (e) => {
    // If Next.js not ready yet, return minimal HTML
    res.writeHead(502);
    res.end('Server starting...');
  });
  req.pipe(proxy);
});

server.listen(PORT, () => {
  console.log(`Proxy listening on ${PORT}, forwarding to ${NEXT_PORT}`);
});
