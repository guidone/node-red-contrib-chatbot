const Sequelize = require('sequelize');

const GraphQLServer = require('./graphql');

let exportCache;

const logging = process.env.DEBUG != null;

module.exports = mcSettings => {
  if (exportCache != null) {
    return exportCache;
  }
  const { dbPath, dbQueuePath } = mcSettings;

  const sequelize = new Sequelize('mission_control', '', '', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: dbPath,
    logging
  });

  const sequelizeTasks = new Sequelize('queue', '', '', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: dbQueuePath,
    logging
  });

  const Configuration = sequelize.define('configuration', {
    namespace: Sequelize.STRING,
    payload: Sequelize.TEXT,
    ts: Sequelize.DATE,
    chatbotId: Sequelize.STRING
  }, {
    indexes: [
      { name: 'configuration_namespace', using: 'BTREE', fields: ['namespace'] },
      { name: 'configuration_chatbotId', using: 'BTREE', fields: ['chatbotId'] }
    ]
  });

  const Content = sequelize.define('content', {
    title: Sequelize.STRING,
    slug: Sequelize.STRING,
    language: Sequelize.STRING,
    namespace: Sequelize.STRING,
    body: Sequelize.TEXT,
    payload: Sequelize.TEXT,
    latitude: Sequelize.DOUBLE,
    longitude: Sequelize.DOUBLE,
    geohash: Sequelize.STRING,
    chatbotId: Sequelize.STRING
  }, {
    indexes: [
      { name: 'content_title', using: 'BTREE', fields: ['title'] },
      { name: 'content_slug', using: 'BTREE', fields: ['slug'] },
      { name: 'content_content', using: 'BTREE', fields: ['body'] },
      { name: 'content_language', using: 'BTREE', fields: ['language'] },
      { name: 'content_namespace', using: 'BTREE', fields: ['namespace'] },
      { name: 'content_geohash', using: 'BTREE', fields: ['geohash'] },
      { name: 'content_chatbotId', using: 'BTREE', fields: ['chatbotId'] },
    ]
  });

  const Category = sequelize.define('category', {
    name: Sequelize.STRING,
    language: Sequelize.STRING,
    namespace: Sequelize.STRING,
    chatbotId: Sequelize.STRING
  }, {
    indexes: [
      { name: 'category_name', using: 'BTREE', fields: ['name'] },
      { name: 'category_language', using: 'BTREE', fields: ['language'] },
      { name: 'category_namespace', using: 'BTREE', fields: ['namespace'] },
      { name: 'categoy_chatbotId', using: 'BTREE', fields: ['chatbotId'] }
    ]
  });

  const Field = sequelize.define('field', {
    name: Sequelize.STRING,
    type: Sequelize.STRING,
    value: Sequelize.TEXT
  }, {
    indexes: [
      { name: 'field_name', using: 'BTREE', fields: ['name'] }
    ]
  });

  Content.Category = Content.belongsTo(Category);
  Content.Fields = Content.hasMany(Field);

  const Message = sequelize.define('message', {
    chatId: Sequelize.STRING,
    userId: Sequelize.STRING,
    from: Sequelize.STRING,
    messageId: Sequelize.STRING,
    transport: Sequelize.STRING,
    flag: Sequelize.STRING,
    type: Sequelize.TEXT,
    content: Sequelize.TEXT,
    inbound: Sequelize.BOOLEAN,
    ts: Sequelize.DATE,
    chatbotId: Sequelize.STRING
  }, {
    indexes: [
      { name: 'message_chatid', using: 'BTREE', fields: ['chatId'] },
      { name: 'message_userid', using: 'BTREE', fields: ['userId'] },
      { name: 'message_from', using: 'BTREE', fields: ['from'] },
      { name: 'message_messageid', using: 'BTREE', fields: ['messageId'] },
      { name: 'message_transport', using: 'BTREE', fields: ['transport'] },
      { name: 'message_flag', using: 'BTREE', fields: ['flag'] },
      { name: 'message_type', using: 'BTREE', fields: ['type'] },
      { name: 'message_inbound', using: 'BTREE', fields: ['inbound'] },
      { name: 'message_ts', using: 'BTREE', fields: ['ts'] },
      { name: 'message_chatbotId', using: 'BTREE', fields: ['chatbotId'] }
    ]
  });

  const Admin = sequelize.define('admin', {
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    first_name: Sequelize.STRING,
    last_name: Sequelize.STRING,
    avatar: Sequelize.STRING,
    email: Sequelize.STRING,
    payload: Sequelize.TEXT,
    permissions: Sequelize.STRING,
    chatbotIds: Sequelize.TEXT
  }, {
    indexes: [
      { name: 'admin_username', using: 'BTREE', fields: ['username'] },
      { name: 'admin_password', using: 'BTREE', fields: ['password'] },
      { name: 'admin_chatbotIds', using: 'BTREE', fields: ['chatbotIds'] }
    ]
  });

  const User = sequelize.define('user', {
    userId: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: Sequelize.STRING,
    first_name: Sequelize.STRING,
    last_name: Sequelize.STRING,
    username: Sequelize.STRING,
    language: Sequelize.STRING,
    payload: Sequelize.TEXT,
    chatbotId: Sequelize.STRING
  }, {
    indexes: [
      { name: 'user_userid', using: 'BTREE', fields: ['userId'] },
      { name: 'user_email', using: 'BTREE', fields: ['email'] },
      { name: 'user_username', using: 'BTREE', fields: ['username'] },
      { name: 'user_language', using: 'BTREE', fields: ['language'] },
      { name: 'user_chatbotId', using: 'BTREE', fields: ['chatbotId'] }
    ]
  });

  const Context = sequelize.define('context', {
    userId: { type: Sequelize.STRING },
    chatId: { type: Sequelize.STRING },
    chatbotId: { type: Sequelize.STRING },
    payload: { type: Sequelize.TEXT }
  }, {
    indexes: [
      { name: 'context_userid', using: 'BTREE', fields: ['userId'] },
      { name: 'context_chatid', using: 'BTREE', fields: ['chatId'] },
      { name: 'context_chatbotId', using: 'BTREE', fields: ['chatbotId'] }
    ]
  });

  const Record = sequelize.define('record', {
    userId: { type: Sequelize.STRING, allowNull: false },
    type: { type: Sequelize.STRING, allowNull: false },
    payload: { type: Sequelize.TEXT },
    title: { type: Sequelize.STRING },
    status: { type: Sequelize.STRING },
    transport: { type: Sequelize.STRING },
    latitude: Sequelize.DOUBLE,
    longitude: Sequelize.DOUBLE,
    geohash: Sequelize.STRING,
    geohash_int: Sequelize.INTEGER,
    chatbotId: Sequelize.STRING
  }, {
    indexes: [
      { name: 'record_userid', using: 'BTREE', fields: ['userId'] },
      { name: 'record_type', using: 'BTREE', fields: ['type'] },
      { name: 'record_status', using: 'BTREE', fields: ['status'] },
      { name: 'record_geohash', using: 'BTREE', fields: ['geohash'] },
      { name: 'record_chatbotId', using: 'BTREE', fields: ['chatbotId'] }
    ]
  })

  const ChatId = sequelize.define('chatid', {
    userId: { type: Sequelize.STRING, allowNull: false },
    chatId: { type: Sequelize.STRING, allowNull: false },
    transport: { type: Sequelize.STRING, allowNull: false },
    chatbotId: { type: Sequelize.STRING }
  }, {
    indexes: [
      { name: 'chatid_userid', using: 'BTREE', fields: ['userId'] },
      { name: 'chatid_chatid', using: 'BTREE', fields: ['chatId'] },
      { name: 'chatid_transport', using: 'BTREE', fields: ['transport'] },
      { name: 'chatid_chatbotId', using: 'BTREE', fields: ['chatbotId'] }
    ]
  });

  const Event = sequelize.define('event', {
    flow: Sequelize.STRING,
    source: Sequelize.STRING,
    name: Sequelize.STRING,
    count: Sequelize.INTEGER
  }, {
    indexes: [
      { name: 'event_flow', using: 'BTREE', fields: ['flow'] },
      { name: 'event_name', using: 'BTREE', fields: ['name'] },
      { name: 'event_source', using: 'BTREE', fields: ['source'] }
    ]
  });

  const ChatBot = sequelize.define('chatbot', {
    name: Sequelize.STRING,
    guid: Sequelize.STRING,
    description: Sequelize.TEXT,
    chatbotId: Sequelize.STRING
  }, {
    indexes: [
      { name: 'chatbot_chatbotId', using: 'BTREE', fields: ['chatbotId'] }
    ]
  });

  const Plugin = sequelize.define('plugins', {
    plugin: Sequelize.STRING,
    version: Sequelize.STRING,
    filename: Sequelize.STRING,
    chatbotId: Sequelize.STRING
  }, {
    indexes: [
    ]
  });

  const { graphQLServer, graphQLSchema } = GraphQLServer({
    Configuration,
    Message,
    User,
    ChatId,
    Event,
    Content,
    Category,
    Field,
    Context,
    Admin,
    Record,
    /*Device,*/
    ChatBot,
    Plugin,
    sequelize,
    sequelizeTasks,
    mcSettings
  });

  exportCache = {
    Configuration,
    Message,
    User,
    graphQLServer,
    graphQLSchema,
    ChatId,
    Event,
    Admin,
    Content,
    Category,
    Field,
    Context,
    Record,
    /*Device,*/
    ChatBot,
    Plugin,
    sequelize,
    sequelizeTasks
  };

  return exportCache;
};