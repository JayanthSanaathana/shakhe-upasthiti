const mongoose = require('mongoose');

/** App DB (shakhes, upasthiti, sessions) — default mongoose connection. */
/** Live entity DB (people, entities, hierarchy, roles) — read-only. */

let liveConn = null;
let liveIsSeparate = false;

function entityMongoUri() {
  return String(process.env.ENTITY_MONGO_URI || process.env.LIVE_MONGO_URI || '').trim();
}

/**
 * Optional SOCKS5 for live DB only (Tailscale userspace exit on Railway).
 * MONGO_SOCKS_PROXY=127.0.0.1:1055
 */
function parseSocksProxy() {
  const raw = String(process.env.MONGO_SOCKS_PROXY || '').trim();
  if (!raw) return null;
  const cleaned = raw.replace(/^socks5h?:\/\//i, '');
  const hostEnv = String(process.env.MONGO_SOCKS_HOST || '').trim();
  const portEnv = Number(process.env.MONGO_SOCKS_PORT || 0);
  if (hostEnv && portEnv > 0) {
    return { proxyHost: hostEnv, proxyPort: portEnv };
  }
  const [host, portRaw] = cleaned.split(':');
  const port = Number(portRaw || 1055);
  if (!host || !Number.isFinite(port) || port <= 0) return null;
  return { proxyHost: host, proxyPort: port };
}

function liveConnectionOptions() {
  const proxy = parseSocksProxy();
  if (!proxy) return {};
  return {
    proxyHost: proxy.proxyHost,
    proxyPort: proxy.proxyPort,
  };
}

function installReadOnlyHooks(schema) {
  if (schema.__entityReadOnly) return;
  schema.__entityReadOnly = true;

  const block = function readOnlyBlock(next) {
    const err = new Error('Refusing write via ENTITY_MONGO_URI models (read-only)');
    if (typeof next === 'function') return next(err);
    throw err;
  };

  const hooks = [
    'save',
    'insertMany',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'replaceOne',
    'bulkWrite',
  ];
  for (const hook of hooks) {
    schema.pre(hook, block);
  }
}

/**
 * Model bound to the live/entity connection (ENTITY_MONGO_URI when set).
 * Always read-only via schema hooks.
 */
function getLiveModel(name, schema, collection) {
  installReadOnlyHooks(schema);

  function resolve() {
    const conn = liveConn || mongoose.connection;
    if (conn.models[name]) return conn.models[name];
    const compiled = schema.clone ? schema.clone() : schema;
    installReadOnlyHooks(compiled);
    return conn.model(name, compiled, collection);
  }

  return new Proxy(function EntityLiveModel() {}, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (prop === Symbol.toStringTag) return 'Model';
      if (prop === '$isLiveModel') return true;
      const model = resolve();
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    },
  });
}

async function connectMongo() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const liveUri = entityMongoUri();
  if (!liveUri || liveUri === process.env.MONGO_URI) {
    liveConn = mongoose.connection;
    liveIsSeparate = false;
    if (!liveUri) {
      console.warn(
        'ENTITY_MONGO_URI not set — reading people/entities/roles from MONGO_URI'
      );
    }
  } else {
    const opts = liveConnectionOptions();
    const viaSocks = Boolean(opts.proxyHost);
    if (viaSocks) {
      try {
        require('socks');
      } catch (_) {
        throw new Error(
          'MONGO_SOCKS_PROXY is set but optional package "socks" is not installed'
        );
      }
    }
    liveConn = mongoose.createConnection(liveUri, opts);
    await liveConn.asPromise();
    liveIsSeparate = true;
    liveConn.on('error', (err) => {
      console.error('ENTITY_MONGO_URI connection error:', err && err.message);
    });
    if (viaSocks) {
      console.log(
        `ENTITY_MONGO_URI connected (read-only via SOCKS5 ${opts.proxyHost}:${opts.proxyPort}) db=${liveConn.name || '(default)'}`
      );
    } else {
      console.log(
        `ENTITY_MONGO_URI connected (read-only) db=${liveConn.name || '(default)'}`
      );
    }
  }

  return {
    app: mongoose.connection,
    live: liveConn,
    liveIsSeparate,
  };
}

function getLiveConnection() {
  return liveConn || mongoose.connection;
}

function getAppConnection() {
  return mongoose.connection;
}

function isLiveSeparate() {
  return liveIsSeparate;
}

module.exports = {
  connectMongo,
  getLiveModel,
  getLiveConnection,
  getAppConnection,
  isLiveSeparate,
  entityMongoUri,
  parseSocksProxy,
};
