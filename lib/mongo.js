const mongoose = require('mongoose');

/** App DB (shakhes, upasthiti, sessions) — default mongoose connection. */
/** Live entity DB (people, entities, hierarchy, roles) — read-only. */

let liveConn = null;
let liveIsSeparate = false;

function entityMongoUri() {
  return String(process.env.ENTITY_MONGO_URI || process.env.LIVE_MONGO_URI || '').trim();
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
    liveConn = mongoose.createConnection(liveUri);
    await liveConn.asPromise();
    liveIsSeparate = true;
    liveConn.on('error', (err) => {
      console.error('ENTITY_MONGO_URI connection error:', err && err.message);
    });
    console.log(
      `ENTITY_MONGO_URI connected (read-only) db=${liveConn.name || '(default)'}`
    );
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
};
