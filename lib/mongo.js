const mongoose = require('mongoose');

/** App DB (shakhes, upasthiti, sessions) — default mongoose connection. */
/** Live entity DB (entities, hierarchy, roles) — read-only. */
/** Person DB (phone/name lookup) — read-only; defaults to the app DB. */

let liveConn = null;
let liveIsSeparate = false;
let personConn = null;
let personIsSeparate = false;

function entityMongoUri() {
  return String(process.env.ENTITY_MONGO_URI || process.env.LIVE_MONGO_URI || '').trim();
}

function personMongoUri() {
  return String(process.env.PERSON_MONGO_URI || process.env.MONGO_URI || '').trim();
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
    const err = new Error('Refusing write via read-only external database model');
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

/** Model bound to PERSON_MONGO_URI. Always read-only via schema hooks. */
function getPersonModel(name, schema, collection) {
  installReadOnlyHooks(schema);

  function resolve() {
    const conn = personConn || mongoose.connection;
    if (conn.models[name]) return conn.models[name];
    const compiled = schema.clone ? schema.clone() : schema;
    installReadOnlyHooks(compiled);
    return conn.model(name, compiled, collection);
  }

  return new Proxy(function PersonLiveModel() {}, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (prop === Symbol.toStringTag) return 'Model';
      if (prop === '$isPersonModel') return true;
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

  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    err.mongoConnectionTarget = 'MONGO_URI';
    throw err;
  }

  const liveUri = entityMongoUri();
  if (!liveUri || liveUri === process.env.MONGO_URI) {
    liveConn = mongoose.connection;
    liveIsSeparate = false;
    if (!liveUri) {
      console.warn(
        'ENTITY_MONGO_URI not set — reading entities/roles from MONGO_URI'
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
    try {
      await liveConn.asPromise();
    } catch (err) {
      err.mongoConnectionTarget = 'ENTITY_MONGO_URI';
      throw err;
    }
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

  const peopleUri = personMongoUri();
  if (peopleUri === process.env.MONGO_URI) {
    personConn = mongoose.connection;
    personIsSeparate = false;
    console.log('PERSON_MONGO_URI using MONGO_URI (read-only person models)');
  } else if (liveUri && peopleUri === liveUri) {
    personConn = liveConn;
    personIsSeparate = liveIsSeparate;
    console.log('PERSON_MONGO_URI using ENTITY_MONGO_URI (read-only person models)');
  } else {
    const opts = liveConnectionOptions();
    personConn = mongoose.createConnection(peopleUri, opts);
    try {
      await personConn.asPromise();
    } catch (err) {
      err.mongoConnectionTarget = 'PERSON_MONGO_URI';
      throw err;
    }
    personIsSeparate = true;
    personConn.on('error', (err) => {
      console.error('PERSON_MONGO_URI connection error:', err && err.message);
    });
    const viaSocks = Boolean(opts.proxyHost);
    console.log(
      viaSocks
        ? `PERSON_MONGO_URI connected (read-only via SOCKS5 ${opts.proxyHost}:${opts.proxyPort}) db=${personConn.name || '(default)'}`
        : `PERSON_MONGO_URI connected (read-only) db=${personConn.name || '(default)'}`
    );
  }

  return {
    app: mongoose.connection,
    live: liveConn,
    liveIsSeparate,
    person: personConn,
    personIsSeparate,
  };
}

function getLiveConnection() {
  return liveConn || mongoose.connection;
}

function getAppConnection() {
  return mongoose.connection;
}

function getPersonConnection() {
  return personConn || mongoose.connection;
}

function isLiveSeparate() {
  return liveIsSeparate;
}

module.exports = {
  connectMongo,
  getLiveModel,
  getPersonModel,
  getLiveConnection,
  getAppConnection,
  getPersonConnection,
  isLiveSeparate,
  entityMongoUri,
  personMongoUri,
  parseSocksProxy,
};
