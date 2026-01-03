#!/usr/bin/env node
/**
 * Development asset server for Ciello widgets
 * 
 * Features:
 * - Correct Content-Type headers for JS/CSS
 * - No caching (Cache-Control: no-store)
 * - CORS enabled
 * - Request logging
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ASSETS_DIR = join(__dirname, 'assets');
const PORT = parseInt(process.env.PORT || '4444', 10);

// MIME types - explicit and correct
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function log(method, path, status, contentType) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const statusColor = status === 200 ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`${timestamp} ${method.padEnd(4)} ${path.padEnd(40)} ${statusColor}${status}${reset} ${contentType || ''}`);
}

const server = createServer(async (req, res) => {
  // Parse URL, strip query params for file lookup
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = join(ASSETS_DIR, pathname);

  // CORS headers (always)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only serve GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    log(req.method, pathname, 405, null);
    return;
  }

  try {
    // Check file exists
    await stat(filePath);
    
    // Read file
    const content = await readFile(filePath);
    const mimeType = getMimeType(filePath);

    // Response headers - NO CACHING
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': content.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    
    // HEAD requests don't get a body
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(content);
    }
    log(req.method, pathname, 200, mimeType);
    
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      log(req.method, pathname, 404, null);
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      log(req.method, pathname, 500, null);
      console.error(err);
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Asset server running on http://localhost:${PORT}`);
  console.log(`📁 Serving: ${ASSETS_DIR}`);
  console.log(`\n   Cache-Control: no-store (disabled)`);
  console.log(`   CORS: enabled\n`);
  console.log('─'.repeat(70));
  console.log('TIME     METHOD PATH                                     STATUS CONTENT-TYPE');
  console.log('─'.repeat(70));
});
