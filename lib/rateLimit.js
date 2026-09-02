const { clientIp } = require('./audit');

const buckets = new Map();

function prune(now) {
  if (buckets.size < 2000) return;
  for (const [key, row] of buckets) {
    if (row.reset <= now) buckets.delete(key);
  }
}

function hit(key, { limit, windowMs }) {
  const now = Date.now();
  prune(now);
  let row = buckets.get(key);
  if (!row || row.reset <= now) {
    row = { n: 0, reset: now + windowMs };
    buckets.set(key, row);
  }
  row.n += 1;
  if (row.n > limit) {
    return {
      error: 'Too many requests — try again later',
      status: 429,
      retryAfterSec: Math.max(1, Math.ceil((row.reset - now) / 1000)),
    };
  }
  return null;
}

function limitRequest(req, name, opts) {
  const key = `${name}:${clientIp(req)}`;
  return hit(key, opts);
}

function middleware(name, opts) {
  return (req, res, next) => {
    if (process.env.RATE_LIMIT_DISABLED === '1') return next();
    const mult = Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER) || 1);
    const limited = limitRequest(req, name, {
      limit: Math.ceil(opts.limit * mult),
      windowMs: opts.windowMs,
    });
    if (!limited) return next();
    res.setHeader('Retry-After', String(limited.retryAfterSec));
    return res.status(429).json({ error: limited.error });
  };
}

module.exports = { hit, limitRequest, middleware };
