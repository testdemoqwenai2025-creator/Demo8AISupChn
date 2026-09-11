// ====================================================================
// Lightweight API server — serves static SPA + API routes with minimal memory
// ====================================================================
// This bypasses Next.js runtime to stay under 3.9GB RAM limit.
// Serves:
//   - /command-center → static HTML from .next/server/app/command-center.html
//   - /api/stats → Prisma aggregate query
//   - /api/orders → Prisma order list
//   - /api/tenders → Prisma tender list
//   - /api/suppliers → Prisma supplier list
//   - /api/audit → Prisma audit log list
// ====================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient({ log: [] });
const PORT = 3001;
const PROJECT_DIR = '/home/z/my-project/AISupChn8-Advanced';

// MIME types
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

// Cache the static HTML
let spaHtml = null;
function getSpaHtml() {
  if (!spaHtml) {
    spaHtml = fs.readFileSync(path.join(PROJECT_DIR, '.next/server/app/command-center.html'), 'utf-8');
  }
  return spaHtml;
}

// API handlers
const apiHandlers = {
  '/api/stats': async () => {
    const [orders, pending, paid, tenders, suppliers, revenue, logs] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: 'pending' } }),
      db.order.count({ where: { status: 'paid' } }),
      db.tender.count({ where: { status: 'open' } }),
      db.supplier.count(),
      db.payment.aggregate({ _sum: { amount: true } }),
      db.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    ]);
    return {
      orders: { total: orders, pending, paid },
      tenders: { active: tenders },
      suppliers: { total: suppliers },
      revenue: { total: revenue._sum.amount || 0 },
      recentActivity: logs,
    };
  },

  '/api/orders': async (url) => {
    const status = url.searchParams.get('status');
    const orders = await db.order.findMany({
      where: status ? { status } : undefined,
      include: { client: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return { orders };
  },

  '/api/tenders': async (url) => {
    const status = url.searchParams.get('status');
    const tenders = await db.tender.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return { tenders };
  },

  '/api/suppliers': async (url) => {
    const region = url.searchParams.get('region');
    const suppliers = await db.supplier.findMany({
      where: region ? { region } : undefined,
      orderBy: { riskScore: 'desc' },
    });
    return { suppliers };
  },

  '/api/audit': async (url) => {
    const orderId = url.searchParams.get('orderId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const logs = await db.auditLog.findMany({
      where: orderId ? { orderId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return { logs };
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // API routes
    if (pathname.startsWith('/api/')) {
      const handler = apiHandlers[pathname];
      if (handler) {
        const data = await handler(url);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }
      // NextAuth endpoint — return basic info
      if (pathname.startsWith('/api/auth/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'NextAuth endpoint active', providers: ['credentials'] }));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // SPA routes
    if (pathname === '/command-center' || pathname === '/') {
      const html = getSpaHtml();
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    // Static file serving (CSS, JS, images)
    let filePath = path.join(PROJECT_DIR, 'public', pathname);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PROJECT_DIR, pathname);
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (err) {
    console.error('Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Lightweight server running at http://localhost:${PORT}`);
  console.log(`  SPA:  http://localhost:${PORT}/command-center`);
  console.log(`  API:  http://localhost:${PORT}/api/stats`);
  console.log(`Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
});

// Keep process alive
process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT', () => { server.close(); process.exit(0); });
