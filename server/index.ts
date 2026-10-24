import { createServer } from 'node:http';
import { handleApiRequest } from './api';
import { createYahooGateway } from './yahoo/gateway';
import { FinanceService } from './yahoo/service';

const PORT = Number(process.env.PORT ?? 8787);
const PREFIX = '/api';

const service = new FinanceService(createYahooGateway());

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname.startsWith(PREFIX) ? url.pathname.slice(PREFIX.length) : url.pathname;

  if (req.method !== 'GET') {
    res.writeHead(405, { Allow: 'GET' }).end();
    return;
  }

  const { status, body, maxAge } = await handleApiRequest(service, pathname, url.searchParams);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...(status === 200 && maxAge ? { 'Cache-Control': `public, max-age=${maxAge}` } : {}),
  });
  res.end(JSON.stringify(body));
}).listen(PORT, () => {
  console.log(`Finance API listening on http://localhost:${PORT}${PREFIX}`);
});
