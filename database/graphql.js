const { ApolloServer } = require('apollo-server-express');
const { resolver } = require('graphql-sequelize');
const { Kind } = require('graphql/language');
const { PubSub } = require('graphql-subscriptions');
const _ = require('lodash');
const geolib = require('geolib');
const Sequelize = require('sequelize');
const fetch = require('node-fetch');
const fs = require('fs');
const geohash = require('ngeohash');
const { Directus } = require('@directus/sdk', {
  auth: {
    autoRefresh: false
  }
});

const { when, hash } = require('../lib/utils');
const translateWhere = require('../src/helpers/translate-where');

const directus = new Directus('https://dashboard.red-bot.io');
const Op = Sequelize.Op;
const pubsub = new PubSub();

const deleteFile = filename => new Promise((resolve, reject) => {
  fs.unlink(filename, err => {
    if (err) {
      reject(err)
    } else {
      resolve();
    }
  });
});

const compactObject = obj => {
  return Object.entries(obj)
    .reduce((accumulator, current) => {
      return current[1] != null ? { ...accumulator, [current[0]]: current[1] } : accumulator;
    }, {});
}

const splitOrder = order => {
  if (!_.isEmpty(order)) {
    return [[order.replace('reverse:', ''), order.startsWith('reverse:') ? 'DESC' : 'ASC']];
  }
  return null;
}

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLScalarType
} = require('graphql');

const DateType = new GraphQLScalarType({
  name: 'Date',
  description: 'Date type',
  parseValue(value) {
    return new Date(value); // value from the client
  },
  serialize(value) {
    return value;
    //return value.getTime(); // value sent to the client
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value) // ast value is always in string format
    }
    return null;
  },
});

const JSONType = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON data type',
  parseValue(value) {
    return JSON.stringify(value);
  },
  serialize(value) {
    let result;
    try {
      result = JSON.parse(value);
    } catch(e) {
      // do nothing
    }
    return result;
  },
  parseLiteral() {
    return null;
  },
});

const PayloadType = new GraphQLScalarType({
  name: 'Payload',
  description: 'Payload (join custom fields in an hash)',
  parseValue() {
    // return JSON.stringify(value);
  },
  serialize(fields) {
    let result = {};
    fields.forEach(field => {
      try {
        result[field.name] = JSON.parse(field.value);
      } catch(e) {
        // do nothing
      }
    });
    return result;
  },
  parseLiteral() {
    return null;
  },
});


module.exports = ({
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
  Device,
  ChatBot,
  Plugin,
  sequelize,
  sequelizeTasks,
  mcSettings
}) => {

  let _cachedChatbotIds;
  const createChatbotIdIfNotExist = async (chatbotId, transaction) => {
    // load cache
    if (_cachedChatbotIds == null) {
      _cachedChatbotIds = await ChatBot.findAll({ transaction }).map(({ chatbotId }) => chatbotId);
    }
    if (!_.isEmpty(chatbotId) && !_cachedChatbotIds.includes(chatbotId)) {
      await ChatBot.create({ chatbotId, name: chatbotId }, { transaction });
      _cachedChatbotIds = [..._cachedChatbotIds, chatbotId];
    }
  };

  const InputUserType = new GraphQLInputObjectType({
    name: 'InputUser',
    description: 'tbd',
    fields: {
      userId: {
        type: GraphQLString,
        description: '',
      },
      email: {
        type: GraphQLString,
        description: '',
      },
      first_name: {
        type: GraphQLString,
        description: '',
      },
      last_name: {
        type: GraphQLString,
        description: '',
      },
      language: {
        type: GraphQLString,
        description: '',
      },
      username: {
        type: GraphQLString,
        description: '',
      },
      payload: {
        type: JSONType,
        description: '',
      },
      context: {
        type: JSONType,
        description: 'The context to update',
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const InputTaskType = new GraphQLInputObjectType({
    name: 'InputTask',
    description: 'Input task for a queue',
    fields: () => ({
      taskId: {
        type: GraphQLString,
        description: 'The task id',
      },
      priority: {
        type: GraphQLInt,
        description: 'The task priority for the current queue'
      },
      task: {
        type: JSONType,
        description: 'The JSON payload of the task'
      },
      createdAt: {
        type: DateType
      }
    })
  });

  const taskType = new GraphQLObjectType({
    name: 'Task',
    description: 'Task for a queue',
    fields: () => ({
      id: {
        type: GraphQLInt,
        description: 'The SQLIte id of the task',
      },
      taskId: {
        type: GraphQLString,
        description: 'The task id',
      },
      priority: {
        type: GraphQLInt,
        description: 'The task priority for the current queue'
      },
      task: {
        type: JSONType,
        description: 'The JSON payload of the task'
      },
      createdAt: {
        type: DateType
      }
    })
  });

  const queueType = new GraphQLObjectType({
    name: 'Queue',
    description: 'Queue of tasks',
    fields: () => ({
      name: {
        type: GraphQLString,
        description: ''
      },
      label: {
        type: GraphQLString,
        description: ''
      },
      tasks: {
        type: new GraphQLList(taskType),
        args: {
          offset: { type: GraphQLInt },
          limit: { type: GraphQLInt },
        },
        resolve: async function(root, { offset = 0, limit = 10 }) {
          const [tasks] = await sequelizeTasks.query(
            `SELECT * FROM :queue
            ORDER BY priority DESC, id ASC
            LIMIT :offset, :limit
            `,
            {
              replacements: { queue: root.name, offset, limit }
            }
          );
          return tasks;
        }
      }
    })
  });

  const chatIdType = new GraphQLObjectType({
    name: 'ChatId',
    description: 'ChatId record, relation between a platform specific chatId and the userId',
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The internal id of the user',
      },
      userId: {
        type: GraphQLString,
        description: ''
      },
      chatId: {
        type: GraphQLString,
        description: ''
      },
      transport: {
        type: GraphQLString,
        description: ''
      },
      user: {
        type: userType,
        description: 'User related to this chatId',
        resolve: (chatId) => User.findOne({ where: { userId: chatId.userId }})
      },
      chatbotId: {
        type: GraphQLString
      }
    })
  });

  const contextType = new GraphQLObjectType({
    name: 'Context',
    description: 'tbd',
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The internal id of the chat context',
      },
      chatId: {
        type: GraphQLString,
        description: ''
      },
      userId: {
        type: GraphQLString,
        description: ''
      },
      payload: {
        type: JSONType,
        description: ''
      }
    })
  });

  const deviceType = new GraphQLObjectType({
    name: 'Device',
    description: 'tbd',
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The unique id of the device',
      },
      status: {
        type: GraphQLString,
        description: ''
      },
      name: {
        type: GraphQLString,
        description: ''
      },
      version: {
        type: GraphQLString,
        description: ''
      },
      payload: {
        type: JSONType,
        description: ''
      },
      jsonSchema: {
        type: JSONType,
        description: ''
      },
      snapshot: {
        type: JSONType,
        description: ''
      },
      lat: {
        type: GraphQLFloat,
        description: ''
      },
      lon: {
        type: GraphQLFloat,
        description: ''
      },
      createdAt: {
        type: DateType
      },
      updatedAt: {
        type: DateType
      },
      lastUpdate: {
        type: DateType
      }
    })
  });

  const recordType = new GraphQLObjectType({
    name: 'Record',
    description: 'tbd',
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: '',
      },
      type: {
        type: GraphQLString,
        description: ''
      },
      title: {
        type: GraphQLString,
        description: ''
      },
      status: {
        type: GraphQLString,
        description: ''
      },
      transport: {
        type: GraphQLString,
        description: ''
      },
      userId: {
        type: GraphQLString,
        description: ''
      },
      payload: {
        type: JSONType,
        description: ''
      },
      createdAt: {
        type: DateType
      },
      user: {
        type: userType,
        resolve: user => User.findOne({ where: { userId: user.userId }})
      },
      latitude: {
        type: GraphQLFloat
      },
      longitude: {
        type: GraphQLFloat
      },
      geohash: {
        type: GraphQLString
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    })
  });

  const InputRecordType = new GraphQLInputObjectType({
    name: 'InputRecord',
    description: 'tbd',
    fields: () => ({
      type: {
        type: GraphQLString,
        description: ''
      },
      title: {
        type: GraphQLString,
        description: ''
      },
      status: {
        type: GraphQLString,
        description: ''
      },
      transport: {
        type: GraphQLString,
        description: ''
      },
      userId: {
        type: GraphQLString,
        description: ''
      },
      payload: {
        type: JSONType,
        description: ''
      },
      createdAt: {
        type: DateType
      },
      latitude: {
        type: GraphQLFloat
      },
      longitude: {
        type: GraphQLFloat
      },
      geohash: {
        type: GraphQLString
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    })
  });

  const userType = new GraphQLObjectType({
    name: 'User',
    description: 'tbd',
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The internal id of the user',
      },
      userId: {
        type: GraphQLString,
        description: '',
      },
      email: {
        type: GraphQLString,
        description: '',
      },
      first_name: {
        type: GraphQLString,
        description: '',
      },
      last_name: {
        type: GraphQLString,
        description: '',
      },
      language: {
        type: GraphQLString,
        description: '',
      },
      username: {
        type: GraphQLString,
        description: '',
      },
      createdAt: {
        type: DateType
      },
      payload: {
        type: JSONType,
        description: '',
      },
      context: {
        type: JSONType,
        description: 'The chat context associated with the user',
        resolve: async user => {
          const context = await Context.findOne({ where: { userId: user.userId }});
          return context != null ? context.payload : null;
        }
      },
      chatIds: {
        type: new GraphQLList(chatIdType),
        args: {
          transport: { type: GraphQLString }
        },
        resolve: (user, args) => {
          const where = { userId: user.userId };
          if (args.transport != null) {
            where.transport = args.transport;
          }
          if (user.chatbotId != null) {
            where.chatbotId = user.chatbotId;
          }
          return ChatId.findAll({ where });
        }
      },
      messages: {
        type: GraphQLList(messageType),
        args: {
          offset: { type: GraphQLInt },
          limit: { type: GraphQLInt },
          order: { type: GraphQLString }
        },
        resolve: (user, args = {}) => {
          let order;
          if (args.order != null) {
            order = [
              [args.order.replace('reverse:', ''), args.order.startsWith('reverse:') ? 'ASC' : 'DESC']
            ];
          }
          return Message.findAll({
            where: { userId: user.userId},
            limit: args.limit,
            offset: args.offset,
            order
          });
        }
      },
      records: {
        type: new GraphQLList(recordType),
        args: {
          order: { type: GraphQLString },
          type: { type: GraphQLString },
          status: { type: GraphQLString },
          offset: { type: GraphQLInt },
          limit: { type: GraphQLInt }
        },
        resolve: (user, { order = 'createdAt', offset, limit, type, status }) => {
          return Record.findAll({
            limit,
            offset,
            order: splitOrder(order),
            where: compactObject({ type, status, userId: user.userId })
          });
        }
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    })
  });

  const adminType = new GraphQLObjectType({
    name: 'Admin',
    description: 'tbd',
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The internal id of the user',
      },
      email: {
        type: GraphQLString,
        description: '',
      },
      first_name: {
        type: GraphQLString,
        description: '',
      },
      last_name: {
        type: GraphQLString,
        description: '',
      },
      avatar: {
        type: GraphQLString,
        description: '',
      },
      username: {
        type: GraphQLString,
        description: '',
      },
      password: {
        type: GraphQLString,
        description: '',
      },
      permissions: {
        type: GraphQLString,
        description: '',
      },
      createdAt: {
        type: DateType
      },
      payload: {
        type: JSONType,
        description: '',
      },
      chatbotIds: {
        type: GraphQLString,
        description: '',
      }
    })
  });

  const InputAdminType = new GraphQLInputObjectType({
    name: 'InputAdmin',
    description: 'tbd',
    fields: () => ({
      email: {
        type: GraphQLString,
        description: '',
      },
      first_name: {
        type: GraphQLString,
        description: '',
      },
      last_name: {
        type: GraphQLString,
        description: '',
      },
      avatar: {
        type: GraphQLString,
        description: '',
      },
      username: {
        type: GraphQLString,
        description: '',
      },
      password: {
        type: GraphQLString,
        description: '',
      },
      permissions: {
        type: GraphQLString,
        description: '',
      },
      createdAt: {
        type: DateType
      },
      payload: {
        type: JSONType,
        description: '',
      },
      chatbotIds: {
        type: GraphQLString,
        description: '',
      }
    })
  });

  const InputMessageType = new GraphQLInputObjectType({
    name: 'InputMessage',
    description: 'tbd',
    fields: () => ({
      user: {
        type: InputUserType,
        description: 'User of the chat message'
      },
      chatId: {
        type: GraphQLString,
        description: '',
      },
      userId: {
        type: GraphQLString,
        description: '',
      },
      messageId: {
        type: GraphQLString,
        description: '',
      },
      from: {
        type: GraphQLString,
        description: '',
      },
      type: {
        type: GraphQLString,
        description: '',
      },
      content: {
        type: GraphQLString,
        description: '',
      },
      transport: {
        type: GraphQLString,
        description: '',
      },
      flag: {
        type: GraphQLString,
        description: '',
      },
      inbound: {
        type: GraphQLBoolean,
        description: ''
      },
      ts: {
        type: GraphQLString,
        description: '',
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    })
  });

  const categoryType = new GraphQLObjectType({
    name: 'Category',
    description: 'tbd',
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The id of the category',
      },
      name: {
        type: GraphQLString,
        description: '',
      },
      language: {
        type: GraphQLString,
        description: '',
      },
      createdAt: {
        type: DateType
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const InputCategoryType = new GraphQLInputObjectType({
    name: 'InputCategory',
    description: 'tbd',
    fields: {
      name: {
        type: GraphQLString,
        description: '',
      },
      language: {
        type: GraphQLString,
        description: '',
      },
      namespace: {
        type: GraphQLString,
        description: '',
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const pluginType = new GraphQLObjectType({
    name: 'Plugin',
    description: 'tbd',
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The id of the plugin',
      },
      plugin: {
        type: GraphQLString,
        description: '',
      },
      version: {
        type: GraphQLString,
        description: '',
      },
      filename: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const chatbotType = new GraphQLObjectType({
    name: 'Chatbot',
    description: 'tbd',
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The id of the chatbot',
      },
      name: {
        type: GraphQLString,
        description: '',
      },
      description: {
        type: GraphQLString,
        description: '',
      },
      guid: {
        type: GraphQLString,
        description: '',
      },
      plugins: {
        type: new GraphQLList(pluginType),
        description: 'The list of installed plugins',
        resolve: (root) => Plugin.findAll({ where: { chatbotId: root.chatbotId }, limit: 9999 })
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const inputChatbotType = new GraphQLInputObjectType({
    name: 'InputChatbot',
    description: 'tbd',
    fields: {
      name: {
        type: GraphQLString,
        description: '',
      },
      description: {
        type: GraphQLString,
        description: '',
      },
      guid: {
        type: GraphQLString,
        description: '',
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const messageType = new GraphQLObjectType({
    name: 'Message',
    description: 'tbd',
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The id of the message',
      },
      chatId: {
        type: GraphQLString,
        description: '',
      },
      userId: {
        type: GraphQLString,
        description: '',
      },
      messageId: {
        type: GraphQLString,
        description: '',
      },
      from: {
        type: GraphQLString,
        description: '',
      },
      type: {
        type: GraphQLString,
        description: '',
      },
      transport: {
        type: GraphQLString,
        description: '',
      },
      flag: {
        type: GraphQLString,
        description: '',
      },
      content: {
        type: GraphQLString,
        description: '',
      },
      inbound: {
        type: GraphQLBoolean,
        description: ''
      },
      createdAt: {
        type: DateType
      },
      ts: {
        type: GraphQLString,
        description: '',
      },
      user: {
        type: userType,
        resolve: (message) => {
          return User.findOne({ where: { userId: message.userId }});
        }
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const configurationType = new GraphQLObjectType({
    name: 'Configuration',
    description: 'tbd',
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The id of the configuration',
      },
      namespace: {
        type: GraphQLString,
        description: '',
      },
      payload: {
        type: GraphQLString,
        description: '',
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const InputFieldType = new GraphQLInputObjectType({
    name: 'InputField',
    description: 'tbd',
    fields: {
      id: {
        type: GraphQLInt,
        description: 'The id of the field',
      },
      name: {
        type: GraphQLString,
        description: '',
      },
      type: {
        type: GraphQLString,
        description: '',
      },
      value: {
        type: JSONType,
        description: '',
      }
    }
  });


  const fieldType = new GraphQLObjectType({
    name: 'Field',
    description: 'tbd',
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The id of the field',
      },
      name: {
        type: GraphQLString,
        description: '',
      },
      type: {
        type: GraphQLString,
        description: '',
      },
      value: {
        type: JSONType,
        description: '',
      }
    }
  });


  const InputContentType = new GraphQLInputObjectType({
    name: 'InputContent',
    description: 'tbd',
    fields: {
      title: {
        type: GraphQLString,
        description: '',
      },
      slug: {
        type: GraphQLString,
        description: '',
      },
      language: {
        type: GraphQLString,
        description: '',
      },
      body: {
        type: GraphQLString,
        description: '',
      },
      namespace: {
        type: GraphQLString,
        description: '',
      },
      payload: {
        type: JSONType,
        description: '',
      },
      fields: {
        type: new GraphQLList(InputFieldType),
        description: ''
      },
      categoryId: {
        type: GraphQLInt
      },
      latitude: {
        type: GraphQLFloat
      },
      longitude: {
        type: GraphQLFloat
      },
      geohash: {
        type: GraphQLString
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const contentType = new GraphQLObjectType({
    name: 'Content',
    description: 'tbd',
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The id of the content',
      },
      title: {
        type: GraphQLString,
        description: '',
      },
      slug: {
        type: GraphQLString,
        description: '',
      },
      language: {
        type: GraphQLString,
        description: '',
      },
      namespace: {
        type: GraphQLString,
        description: '',
      },
      body: {
        type: GraphQLString,
        description: '',
      },
      fields: {
        type: new GraphQLList(fieldType),
        resolve(root) {
          return root.getFields({ limit: 9999 });
        }
      },
      categoryId: {
        type: GraphQLInt
      },
      category: {
        type: categoryType,
        resolve(root) {
          return root.getCategory();
        }
      },
      payload: {
        type: JSONType,
        description: '',
      },
      json: {
        type: PayloadType,
        resolve(root) {
          return root.getFields({ limit: 9999 });
        }
      },
      createdAt: {
        type: DateType
      },
      latitude: {
        type: GraphQLFloat
      },
      longitude: {
        type: GraphQLFloat
      },
      geohash: {
        type: GraphQLString
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    }
  });

  const InputConfigurationType = new GraphQLInputObjectType({
    name: 'InputConfiguration',
    description: 'tbd',
    fields: () => ({
      namespace: {
        type: GraphQLString,
        description: '',
      },
      payload: {
        type: GraphQLString,
        description: '',
      },
      chatbotId: {
        type: GraphQLString,
        description: '',
      }
    })
  });


  const messageCounterType = new GraphQLObjectType({
    name: 'MessageCounters',
    description: 'Message Counters',
    fields: {
      count: {
        type: GraphQLInt,
        args: {
          type: { type: GraphQLString },
          transport: { type: GraphQLString },
          messageId: { type: GraphQLString },
          chatId: { type: GraphQLString },
          userId: { type: GraphQLString },
          flag: { type: GraphQLString },
          inbound: { type: GraphQLBoolean },
          chatbotId: { type: GraphQLString }
        },
        description: 'Total messages',
        resolve: (root, { type, transport, messageId, chatId, userId, flag, inbound, chatbotId }) => Message.count({
          where: compactObject({
            type, transport, messageId, chatId, userId, flag, inbound, chatbotId
          })
        })
      }
    }
  });

  const aggregatedEvent = new GraphQLObjectType({
    name: 'aggregatedEvent',
    description: 'Aggregation of event',
    fields: {
      flow: {
        type: GraphQLString
      },
      count: {
        type: GraphQLInt
      }
    }
  });

  const eventCounterType = new GraphQLObjectType({
    name: 'EventCounters',
    description: 'Event Counters',
    fields: {
      count: {
        type: GraphQLInt,
        description: 'Total events',
        resolve: () => Event.count()
      },
      events: {
        type: new GraphQLList(aggregatedEvent),
        resolve() {
          return Event
            .findAll({
              group: ['flow'],
              attributes: ['flow', [sequelize.fn('COUNT', 'flow'), 'count']],
            })
            .then(res => res.map(item => item.dataValues));
        }
      }
    }
  });

  const userCounterType = new GraphQLObjectType({
    name: 'UserCounters',
    description: 'User Counters',
    fields: {
      count: {
        type: GraphQLInt,
        description: 'Total users',
        args: {
          userId: { type: GraphQLString },
          username: { type: GraphQLString },
          chatbotId: { type: GraphQLString }
        },
        resolve: (root, { userId, username, chatbotId }) => User.count({
          where: compactObject({
            userId,
            chatbotId,
            username: username != null ? { [Op.like]: `%${username}%` } : null
          })
        })
      }
    }
  });

  const deviceCounterType = new GraphQLObjectType({
    name: 'DeviceCounters',
    description: 'Device Counters',
    fields: {
      count: {
        type: GraphQLInt,
        description: 'Total devices',
        args: {
        },
        resolve: () => Device.count()
      }
    }
  });

  const taskCounterType = new GraphQLObjectType({
    name: 'TaskCounters',
    description: 'Task Counters',
    fields: {
      count: {
        type: GraphQLInt,
        description: 'Total tasks',
        args: {
          queue: { type: GraphQLString }
        },
        resolve: async(root, { queue }) => {
          const [count] = await sequelizeTasks.query(
            'SELECT count(*) as \'total\' FROM :queue;',
            {
              replacements: { queue }
            }
          );
          return !_.isEmpty(count) ? count[0].total : 0;
        }
      }
    }
  });

  const adminCounterType = new GraphQLObjectType({
    name: 'AdminCounters',
    description: 'User Counters',
    fields: {
      count: {
        type: GraphQLInt,
        description: 'Total admins',
        args: {
          username: { type: GraphQLString },
          chatbotId: { type: GraphQLString }
        },
        resolve: (root, { username, chatbotId }) => Admin.count({
          where: compactObject({
            username: username != null ? { [Op.like]: `%${username}%` } : null,
            chatbotId
          })
        })
      }
    }
  });

  const categoryCounterType = new GraphQLObjectType({
    name: 'CategoryCounters',
    description: 'Category Counters',
    fields: {
      count: {
        type: GraphQLInt,
        args: {
          namespace: { type: GraphQLString },
          chatbotId: { type: GraphQLString }
        },
        description: 'Total categories',
        resolve: (root, { namespace, chatbotId }) => Category.count({
          where: compactObject({
            namespace, chatbotId
          })
        })
      }
    }
  });

  const recordCounterType = new GraphQLObjectType({
    name: 'RecordCounters',
    description: 'Record Counters',
    fields: {
      count: {
        type: GraphQLInt,
        args: {
          type: { type: GraphQLString },
          userId: { type: GraphQLString },
          status: { type: GraphQLString },
          chatbotId: { type: GraphQLString }
        },
        description: 'Total records',
        resolve: (root, { type, userId, status, chatbotId }) => Record.count({
          where: compactObject({
            type, userId, status, chatbotId
          })
        })
      }
    }
  });

  const buildContentQuery = ({
    slug,
    categoryId,
    language,
    title,
    id,
    ids,
    namespace,
    search,
    slugs,
    chatbotId
    /*,
    latitude,
    longitude,
    precision = 100*/
  }) => {
    const whereParams = compactObject({
      id: _.isArray(ids) && !_.isEmpty(ids) ? { [Op.in]: ids } : id,
      categoryId,
      slug: _.isArray(slugs) && !_.isEmpty(slugs) ? { [Op.in]: slugs } : slug,
      language,
      namespace
    });
    if (title != null) {
      whereParams.title = { [Op.like]: `%${title}%` };
    }
    if (search != null) {
      whereParams[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
      ]
    }
    if (!_.isEmpty(chatbotId)) {
      whereParams.chatbotId = chatbotId;
    }
    /*if (longitude != null && latitude != null && precision > 9) {
      const [sw, ne] = geolib.getBoundsOfDistance({ latitude, longitude }, precision);
      where[Op.and] = [
        { 'latitude': { [Op.gte]: sw.latitude }},
        { 'latitude': { [Op.lte]: ne.latitude }},
        { 'longitude': { [Op.gte]: sw.longitude }},
        { 'longitude': { [Op.lte]: ne.longitude }},
      ]
    }*/
    return whereParams;
  }


  const contentCounterType = new GraphQLObjectType({
    name: 'ContentCounters',
    description: 'Content Counters',
    fields: {
      count: {
        type: GraphQLInt,
        description: 'Total contents',
        args: {
          slug: { type: GraphQLString },
            order: { type: GraphQLString },
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            categoryId: { type: GraphQLInt },
            id: { type: GraphQLInt },
            ids: { type: new GraphQLList(GraphQLInt)},
            slugs: { type: new GraphQLList(GraphQLString)},
            language: { type: GraphQLString },
            namespace: { type: GraphQLString },
            title: { type: GraphQLString },
            search: { type: GraphQLString },
            chatbotId: { type: GraphQLString }
          },
        resolve(root, { slug, categoryId, language, title, id, ids, namespace, search, slugs, chatbotId }) {
          return Content.count({
            where: buildContentQuery({ slug, categoryId, language, title, id, ids, namespace, search, slugs, chatbotId })
          });
        }
      }
    }
  });

  const countersType = new GraphQLObjectType({
    name: 'Counters',
    description: 'Counters',
    fields: {
      messages: {
        type: messageCounterType,
        description: 'Counters for messages',
        resolve: () => {
          return {};
        }
      },
      users: {
        type: userCounterType,
        description: 'Counters for users',
        resolve: () => {
          return {};
        }
      },
      admins: {
        type: adminCounterType,
        description: 'Counters for users',
        resolve: () => {
          return {};
        }
      },
      events: {
        type: eventCounterType,
        description: 'Counters for events',
        resolve: () => {
          return {};
        }
      },
      contents: {
        type: contentCounterType,
        description: 'Counters for contents',
        resolve: () => {
          return {};
        }
      },
      categories: {
        type: categoryCounterType,
        description: 'Counters for categories',
        resolve: () => {
          return {};
        }
      },
      records: {
        type: recordCounterType,
        description: 'Counters for user records',
        resolve: () => {
          return {};
        }
      },
      devices: {
        type: deviceCounterType,
        description: 'Counters for devices',
        resolve: () => {
          return {};
        }
      },
      tasks: {
        type: taskCounterType,
        description: 'Counters for devices',
        resolve: () => {
          return {};
        }
      }
    }
  });


  const schema = new GraphQLSchema({

    mutation: new GraphQLObjectType({
      name: 'Mutations',
      description: 'These are the things we can change',
      fields: {

        deleteEvent: {
          type: GraphQLString,
          args: {
            flow: { type: new GraphQLNonNull(GraphQLString) }
          },
          resolve: async function(root, { flow }) {
            await Event.destroy({ where: { flow }});
            return true;
          }
        },

        createConfiguration: {
          type: configurationType,
          args: {
            configuration: { type: new GraphQLNonNull(InputConfigurationType) }
          },
          resolve: async (root, { configuration }) => {
            const found = await Configuration.findOne({
              where: compactObject({ namespace: configuration.namespace, chatbotId: configuration.chatbotId })
            });
            if (found != null) {
              await Configuration.update(configuration, { where: { id: found.id }})
              return await Configuration.findByPk(found.id);
            } else {
              return await Configuration.create(configuration);
            }
          }
        },

        createContent: {
          type: contentType,
          args: {
            content: { type: new GraphQLNonNull(InputContentType) }
          },
          resolve: function(root, { content }) {
            // calculate geohash if not provided
            if (content.longitude != null && content.latitude != null) {
              content.geohash = geohash.encode(content.latitude, content.longitude);
            }
            return Content.create(content, {
              include: [Content.Fields]
            });
          }
        },

        createRecord: {
          type: recordType,
          args: {
            record: { type: new GraphQLNonNull(InputRecordType) }
          },
          resolve: function(root, { record }) {
            // calculate geohash if not provided
            if (record.longitude != null && record.latitude != null) {
              record.geohash = geohash.encode(record.latitude, record.longitude);
              record.geohash_int = geohash.encode_int(record.latitude, record.longitude);
            }
            return Record.create(record);
          }
        },

        createCategory: {
          type: categoryType,
          args: {
            category: { type: new GraphQLNonNull(InputCategoryType)}
          },
          resolve: function(root, { category }) {
            return Category.create(category);
          }
        },

        editChatbot: {
          type: chatbotType,
          args: {
            id: { type: GraphQLNonNull(GraphQLInt) },
            chatbot: { type: new GraphQLNonNull(inputChatbotType)}
          },
          async resolve(root, { chatbot, id }) {
            await ChatBot.update(chatbot, { where: { id } });
            return await ChatBot.findOne({ where: { id }});
          }
        },

        editCategory: {
          type: categoryType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)},
            category: { type: new GraphQLNonNull(InputCategoryType)}
          },
          resolve(root, { id, category }) {
            return Category.update(category, { where: { id } })
              .then(() => Category.findByPk(id));
          }
        },

        editRecord: {
          type: recordType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)},
            record: { type: new GraphQLNonNull(InputRecordType)}
          },
          resolve(root, { id, record }) {
            // calculate geohash if not provided
            if (record.longitude != null && record.latitude != null) {
              record.geohash = geohash.encode(record.latitude, record.longitude);
              record.geohash_int = geohash.encode_int(record.latitude, record.longitude);
            }
            return Record.update(record, { where: { id } })
              .then(() => Record.findByPk(id));
          }
        },

        deleteCategory: {
          type: contentType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)}
          },
          resolve: async function(root, { id }) {
            const category = await Category.findByPk(id);
            // destroy user and related chatIds
            if (category != null) {
              await category.destroy();
            }
            return category;
          }
        },

        editContent: {
          type: contentType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)},
            content: { type: new GraphQLNonNull(InputContentType) }
          },
          resolve: async (root, { id, content }) => {
            // calculate geohash if not provided
            if (content.longitude != null && content.latitude != null) {
              content.geohash = geohash.encode(content.latitude, content.longitude);
            }
            await Content.update(content, { where: { id } })
            const updatedContent = await Content.findByPk(id, { include: [Content.Fields]} );
            const currentFieldIds = updatedContent.fields.map(field => field.id);
            if (_.isArray(content.fields) && content.fields.length !== 0) {
              let task = when(true);
              const newFieldIds = _.compact(content.fields.map(field => field.id));
              // now add or update each field present in the payload
              content.fields.forEach(field => {
                if (field.id != null) {
                  task = task.then(() => Field.update(field, { where: { id: field.id } }));
                } else {
                  task = task.then(() => updatedContent.createField(field));
                }
              });
              // remove all current id field that are not included in the list of new ids
              currentFieldIds
                .filter(id => !newFieldIds.includes(id))
                .forEach(id => {
                  task = task.then(() => Field.destroy({ where: { id }}));
                });
              await task;
              return Content.findByPk(id, { include: [Content.Fields]} );

            } else {
              return updatedContent;
            }
          }
        },

        deleteContent: {
          type: contentType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)}
          },
          resolve: async function(root, { id }) {
            const content = await Content.findByPk(id);
            // destroy user and related chatIds
            if (content != null) {
              await content.destroy();
            }
            return content;
          }
        },

        deleteRecord: {
          type: recordType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)}
          },
          resolve: async function(root, { id }) {
            const record = await Record.findByPk(id);
            // destroy user and related chatIds
            if (record != null) {
              await record.destroy();
            }
            return record;
          }
        },

        deleteAdmin: {
          type: adminType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)}
          },
          resolve: async function(root, { id }) {
            const admin = await Admin.findByPk(id);
            await Admin.destroy({ where: { id }});
            return admin;
          }
        },

        updateTask: {
          type: taskType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)},
            queue: { type: GraphQLString },
            task: { type: InputTaskType}
          },
          resolve: async function(root, { id, queue, task }) {
            // update the json
            await sequelizeTasks.query(
              'UPDATE :queue SET task = :json, priority = :priority WHERE id = :id;',
              {
                replacements: {
                  id, queue, json: task.task, priority: task.priority
                }
              }
            );
            // get again
            const [updatedTask] = await sequelizeTasks.query(
              'SELECT * FROM :queue WHERE id = :id;',
              {
                replacements: {
                  id, queue
                }
              }
            );
            return updatedTask[0];
          }
        },

        deleteTask: {
          type: taskType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)},
            queue: { type: GraphQLString }
          },
          resolve: async function(root, { id, queue }) {
            const task = await sequelizeTasks.query(
              'SELECT *  FROM :queue WHERE id = :id;',
              {
                replacements: { id, queue }
              }
            );
            if (task.length !== 0) {
              await sequelizeTasks.query(
                'DELETE FROM :queue WHERE id = :id;',
                {
                  replacements: { id, queue }
                }
              );
              return task[0];
            }
            return null;
          }
        },

        deleteTasks: {
          type: new GraphQLList(GraphQLInt),
          args: {
            ids: { type: new GraphQLList(GraphQLInt)},
            queue: { type: GraphQLString },
            all: { type: GraphQLBoolean }
          },
          resolve: async function(root, { all, ids, queue }) {
            if (all) {
              await sequelizeTasks.query(
                'DELETE FROM :queue;',
                {
                  replacements: { queue }
                }
              );
              return [];
            } else {
              await sequelizeTasks.query(
                'DELETE FROM :queue WHERE id IN (:ids);',
                {
                  replacements: { ids, queue }
                }
              );
              return ids;
            }
          }
        },

        editAdmin: {
          type: adminType,
          args: {
            id: { type: GraphQLInt},
            admin: { type: new GraphQLNonNull(InputAdminType) }
          },
          async resolve(root, { id, admin }) {
            if (!_.isEmpty(admin.password)) {
              admin.password = hash(admin.password, { salt: mcSettings.salt });
            }
            await Admin.update(admin, { where: { id } })
            return await Admin.findOne({ where: { id } });
          }
        },

        createAdmin: {
          type: adminType,
          args: {
            admin: { type: new GraphQLNonNull(InputAdminType)}
          },
          resolve: function(root, { admin }) {
            if (!_.isEmpty(admin.password)) {
              admin.password = hash(admin.password, { salt: mcSettings.salt });
            }
            return Admin.create(admin);
          }
        },

        editUser: {
          type: userType,
          args: {
            id: { type: GraphQLInt},
            userId: { type: GraphQLString },
            user: { type: new GraphQLNonNull(InputUserType) }
          },
          async resolve(root, { id, userId, user: value }) {
            let where;
            if (id != null) {
              where = { id };
            } else if (userId != null) {
              where = { userId };
            } else {
              throw 'Missing both id and userId';
            }
            // if context is present, update using userId
            if (value.context) {
              const user = await User.findOne({ where });
              await Context.update({ payload: value.context }, { where: { userId: user.userId }});
              delete value.context;
            }
            await User.update(value, { where })
            return await User.findOne({ where });
          }
        },

        mergeUser: {
          type: userType,
          args: {
            fromId: { type: new GraphQLNonNull(GraphQLInt)},
            toId: { type: new GraphQLNonNull(GraphQLInt)},
            chatbotId: { type: GraphQLString }
          },
          resolve: async function(root, { fromId, toId, chatbotId }) {
            const fromUser = await User.findByPk(fromId);
            const toUser = await User.findByPk(toId);

            const fromChatIds = await ChatId.findAll({ where: { userId: fromUser.userId, chatbotId }});
            const toChatIds = await ChatId.findAll({ where: { userId: toUser.userId, chatbotId }});

            // find all fields from the source user that are empty in the destination user and can be used
            const fieldsToUpdate = ['email', 'first_name', 'last_name', 'username', 'language'];
            const updateToUser = {};
            for (const field of fieldsToUpdate) {
              if (!_.isEmpty(fromUser[field]) && _.isEmpty(toUser[field])) {
                updateToUser[field] = fromUser[field];
                toUser[field] = fromUser[field];
              }
            }
            // update user if not empty
            if (_.isEmpty(updateToUser)) {
              await User.update(updateToUser, { where: { id: toUser.id }});
            }
            // turn only chatIds that don't already exists
            for (const item of fromChatIds) {
              const hasTransport = toChatIds.filter(({ transport }) => transport === item.transport).length !== 0;
              if (!hasTransport) {
                await ChatId.update({ userId: toUser.userId }, { where: { id: item.id }});
              }
            }
            // turn all old messages into new userId
            await Message.update({ userId: toUser.userId }, { where: { userId: fromUser.userId, chatbotId }});
            // finally destroy source user
            await User.destroy({ where: { id: fromUser.id }});
            return toUser;
          }
        },

        deleteUser: {
          type: userType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)}
          },
          resolve: async function(root, { id }) {
            const user = await User.findByPk(id);
            const userId = user.userId;
            // destroy user and related chatIds
            if (user != null) {
              await user.destroy();
            }
            await ChatId.destroy({ where: { userId }});
            await Context.destroy({ where: { userId }});
            return user;
          }
        },

        deleteChatId: {
          type: userType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLInt)}
          },
          resolve: async function(root, { id }) {
            const chatId = await ChatId.findByPk(id);
            await chatId.destroy();
            return User.findOne({ where: { userId: chatId.userId }});
          }
        },

        installPlugin: {
          type: pluginType,
          args: {
            plugin: { type: GraphQLString },
            url: { type: GraphQLString },
            version: { type: GraphQLString },
            initialConfiguration: { type: GraphQLString },
            initialContent: { type: InputContentType },
            chatbotId: { type: GraphQLString },
            pluginId: { type: GraphQLString }
          },
          resolve: async function(root, {
            plugin,
            url,
            version,
            initialConfiguration,
            initialContent,
            chatbotId,
            pluginId
          }) {

            const response = await fetch(url);
            if (!response.ok) {
              throw `Error trying to download plugin at ${url}`;
            }

            // write down plugin
            const filename = `${plugin}-${hash((new Date().toString()))}.js`;
            const pluginFile = fs.createWriteStream(`${mcSettings.pluginsPath}/${filename}`);
            response.body.pipe(pluginFile);

            // destroy and re-create (only one plugin per chatbot.id)
            await Plugin.destroy({ where: { plugin, chatbotId }});
            const installedPlugin = await Plugin.create({ plugin, url, version, chatbotId, filename });
            // create default configuration, if any, if not already exist
            if (!_.isEmpty(initialConfiguration)) {
              const existsConfiguration = await Configuration.findOne({
                where: compactObject({ namespace: plugin, chatbotId })
              });
              if (existsConfiguration == null) {
                await Configuration.create({
                  namespace: plugin,
                  payload: initialConfiguration,
                  chatbotId
                });
              }
            }
            // create content if needed
            if (initialContent != null && !_.isEmpty(initialContent.title)) {
              let slugExists = false;
              if (!_.isEmpty(initialContent.slug)) {
                slugExists = await Content.findOne({ where: compactObject({ slug: initialContent.slug, chatbotId })}) != null;
              }
              if (!slugExists) {
                await Content.create({
                  namespace: 'content',
                  language: 'en',
                  chatbotId,
                  ...initialContent
                });
              }
            }

            // create an anonymous install record
            //await directus.auth.static('anonymous2');
            await directus.auth.login({
              email: 'anonymous@nowhere.com',
              password: 'Anonymous42!',
            });
            await directus.items('orders').createOne({
              status: 'free',
              anonymous: true,
              chatbotId,
              plugin: pluginId,
              amount: 0
            });

            return installedPlugin;
          }
        },

        updatePlugin: {
          type: pluginType,
          args: {
            plugin: { type: GraphQLString },
            url: { type: GraphQLString },
            version: { type: GraphQLString },
            initialConfiguration: { type: GraphQLString },
            chatbotId: { type: GraphQLString }
          },
          resolve: async function(root, { plugin, url, version, initialConfiguration, chatbotId }) {
            // get the current plugin
            const currentInstall = await Plugin.findOne({ where: { plugin }});
            // if found, otherwise just create
            if (currentInstall != null) {
              deleteFile(`${mcSettings.pluginsPath}/${currentInstall.filename}`);
              await currentInstall.destroy();
            }
            // get the plugin code
            const response = await fetch(url);
            const filename = `${plugin}-${hash((new Date().toString()))}.js`;
            const pluginFile = fs.createWriteStream(`${mcSettings.pluginsPath}/${filename}`);
            response.body.pipe(pluginFile);

            // destroy and re-create
            await Plugin.destroy({ where: { plugin }});
            const installedPlugin = await Plugin.create({ plugin, url, version, chatbotId, filename });
            // create default configuration, if any, if not already exist
            if (!_.isEmpty(initialConfiguration)) {
              const existsConfiguration = await Configuration.findOne({ where: { namespace: plugin }});
              if (existsConfiguration == null) {
                await Configuration.create({
                  namespace: plugin,
                  payload: initialConfiguration
                });
              }
            }
            return installedPlugin;
          }
        },

        uninstallPlugin: {
          type: pluginType,
          args: {
            plugin: { type: GraphQLString },
            chatbotId: { type: GraphQLString }
          },
          resolve: async function(root, { plugin }) {
            const deletedPlugin = await Plugin.findOne({ where: { plugin }});
            await Plugin.destroy({ where: { plugin }});
            await Configuration.destroy({ where: { namespace: plugin }});
            try {
              await deleteFile(`${mcSettings.pluginsPath}/${deletedPlugin.filename}`);
            } catch(e) {
              // do nothing, perhaps dir was removed
            }
            return deletedPlugin;
          }
        },

        editMessage: {
          type: messageType,
          args: {
            messageId: { type: GraphQLString },
            message: { type: new GraphQLNonNull(InputMessageType) }
          },
          resolve: async function(root, { messageId, message }) {
            await Message.update(message, { where: { messageId } });
          }
        },

        createMessage: {
          type: messageType,
          args: {
            message: { type: new GraphQLNonNull(InputMessageType) }
          },
          resolve: async function(root, { message }) {
            const { user, ...newMessage } = message;
            const transaction = await sequelize.transaction();

            try {
              // check if chatbotId exists
              await createChatbotIdIfNotExist(message.chatbotId, transaction);
              // check if exists userid / transport and create or update
              const existingChatId = await ChatId.findOne({
                where: compactObject({
                  chatId: String(message.chatId),
                  transport: message.transport,
                  chatbotId: message.chatbotId
                })
              }, { transaction });
              let userId;
              // if no chatId, the create the user and the related chatId-transport using the userId of the message
              if (existingChatId == null) {
                try {
                  await User.create(user, { transaction });
                } catch(e) {
                  // this could fail, the user already exists (was only deleted the chatId)
                  // keep the existing one, the admin may have enriched the payload
                  // then get the current user
                  // currentUser = await User.findOne({ where: { userId: user.userId }});
                  // eslint-disable-next-line no-console
                  console.log(`Error creating user ${JSON.stringify(user)}, perhaps user already exists`);
                  // eslint-disable-next-line no-console
                  console.log(e);
                }
                userId = user.userId;
                if (message.chatId != null) {
                  await ChatId.create({
                    userId: user.userId,
                    chatId: String(message.chatId),
                    chatbotId: message.chatbotId,
                    transport: message.transport
                  }, { transaction });
                } else {
                  // eslint-disable-next-line no-console
                  console.trace(`Warning: received message without chatId for transport ${message.transport}`)
                }
              } else {
                userId = existingChatId.userId;
                // check if user exists, create if missing
                const existingUser = await User.findOne({
                  where: compactObject({
                    userId: existingChatId.userId,
                    chatbotId: message.chatbotId
                  }, { transaction })
                });
                if (existingUser == null) {
                  try {
                    await User.create(user, { transaction });
                  } catch(e) {
                    // this could fail, the user already exists (was only deleted the chatId)
                    // keep the existing one, the admin may have enriched the payload
                    // then get the current user
                    // currentUser = await User.findOne({ where: { userId: user.userId }});
                    // eslint-disable-next-line no-console
                    console.log(`Error creating user ${JSON.stringify(user)}, perhaps user already exists`);
                    // eslint-disable-next-line no-console
                    console.log(e);
                  }
                }
              }
              // finally store the message
              const createdMessage = await Message.create({ ...newMessage, userId }, { transaction });

              await transaction.commit();

              return createdMessage;
            } catch(e) {
              await transaction.rollback();
              throw e;
            }
          }
        }
      }
    }),

    query: new GraphQLObjectType({
      name: 'Queries',
      fields: {

        tasks: {
          type: new GraphQLList(taskType),
          description: 'List all tasks for a queue',
          args: {
            queue: { type: new GraphQLNonNull(GraphQLString) },
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt }
          },
          resolve: async function(root, { queue, offset = 0, limit = 10 }) {
            try {
              const [tasks] = await sequelizeTasks.query(
                `SELECT * FROM :queue
                ORDER BY priority DESC, id ASC
                LIMIT :offset, :limit
                `, {
                  replacements: { queue, offset, limit }
                });
              return tasks;
            } catch(e) {
              return `Queueu "${queue}" not found.`
            }
          }
        },

        queues: {
          type: new GraphQLList(queueType),
          args: {
            name: { type: GraphQLString }
          },
          resolve: async function(root, { name }) {
            const [results] = await sequelizeTasks.query('SELECT name FROM sqlite_schema WHERE type=\'table\' ORDER BY name;');
            return results
              .filter(({ name }) => name.startsWith('tasks'))
              .map(obj => ({
                ...obj,
                label: obj.name === 'tasks' ? 'default' : obj.name.replace('tasks-', '')
              }))
              .filter(queue => _.isEmpty(name) || queue.name === name);
          }
        },

        queue: {
          type: queueType,
          args: {
            name: { type: new GraphQLNonNull(GraphQLString) }
          },
          resolve: async function(root, { name }) {
            const [results] = await sequelizeTasks.query('SELECT name FROM sqlite_schema WHERE type=\'table\' ORDER BY name;');
            return results.find(queue => queue.name === name);
          }
        },

        chatbot: {
          type: chatbotType,
          args: {
            id: { type: GraphQLInt },
            chatbotId: { type: GraphQLString }
          },
          resolve: resolver(ChatBot)
        },

        chatbots: {
          type: new GraphQLList(chatbotType),
          resolve: resolver(ChatBot)
        },

        contexts: {
          type: new GraphQLList(contextType),
          args: {
            id: { type: GraphQLInt },
            chatId: { type: GraphQLString },
            userId: { type: GraphQLString }
          },
          resolve: resolver(Context)
        },

        configurations: {
          type: new GraphQLList(configurationType),
          args: {
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            order: { type: GraphQLString },
            namespace: { type: GraphQLString },
            chatbotId: { type: GraphQLString }
          },
          resolve: resolver(Configuration)
        },

        users: {
          type: new GraphQLList(userType),
          args: {
            chatbotId: { type: GraphQLString },
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            id: { type: GraphQLInt },
            order: { type: GraphQLString },
            userId: { type: GraphQLString },
            username: { type: GraphQLString },
            search: { type: GraphQLString }
          },
          resolve(root, { order, offset = 0, limit = 10, userId, username, id, search, chatbotId }) {
            const whereParams = compactObject({
              id,
              userId,
              chatbotId,
              username: username != null ? { [Op.like]: `%${username}%` } : null,
            });
            if (search != null) {
              whereParams[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } }
              ]
            }
            return User.findAll({
              limit,
              offset,
              order: splitOrder(order),
              where: whereParams
            });
          }
        },

        admins: {
          type: new GraphQLList(adminType),
          args: {
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            id: { type: GraphQLInt },
            order: { type: GraphQLString },
            username: { type: GraphQLString },
            search: { type: GraphQLString }
          },
          resolve(root, { order, offset = 0, limit = 10, username, id, search }) {
            const whereParams = compactObject({
              id,
              username: username != null ? { [Op.like]: `%${username}%` } : null,
            });
            if (search != null) {
              whereParams[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } }
              ]
            }
            return Admin.findAll({
              limit,
              offset,
              order: splitOrder(order),
              where: whereParams
            });
          }
        },

        user: {
          type: userType,
          args: {
            userId: { type: GraphQLString },
            chatbotId: { type: GraphQLString },
            id: { type: GraphQLInt }
          },
          resolve: resolver(User)
        },

        contents: {
          type: new GraphQLList(contentType),
          args: {
            chatbotId: { type: GraphQLString },
            slug: { type: GraphQLString },
            order: { type: GraphQLString },
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            categoryId: { type: GraphQLInt },
            id: { type: GraphQLInt },
            ids: { type: new GraphQLList(GraphQLInt)},
            slugs: { type: new GraphQLList(GraphQLString)},
            language: { type: GraphQLString },
            namespace: { type: GraphQLString },
            title: { type: GraphQLString },
            search: { type: GraphQLString },
            longitude: { type: GraphQLFloat },
            latitude: { type: GraphQLFloat },
            precision: { type: GraphQLInt }
          },
          resolve(root, {
            slug,
            order,
            offset = 0,
            limit = 10,
            categoryId,
            language,
            title,
            id,
            ids,
            namespace,
            search,
            slugs,
            latitude,
            longitude,
            precision = 9,
            chatbotId
          }) {
            return Content.findAll({
              limit,
              offset,
              order: splitOrder(order),
              where: buildContentQuery({
                slug,
                categoryId,
                language,
                title,
                id,
                ids,
                namespace,
                search,
                slugs,
                latitude,
                longitude,
                precision,
                chatbotId
              })
            });
          }
        },

        content: {
          type: contentType,
          args: {
            slug: { type: GraphQLString },
            id: { type: GraphQLInt }
          },
          resolve: resolver(Content)
        },

        /*device: {
          type: deviceType,
          args: {
            id: { type: GraphQLInt }
          },
          resolve: resolver(Device)
        },*/

        record: {
          type: recordType,
          args: {
            id: { type: GraphQLInt }
          },
          resolve: resolver(Record)
        },

        chatIds: {
          type: new GraphQLList(chatIdType),
          args: {
            chatId: { type: GraphQLString },
            userId: { type: GraphQLString },
            transport: { type: GraphQLString }
          },
          resolve: resolver(ChatId)
        },

        messages: {
          type: new GraphQLList(messageType),
          args: {
            chatbotId: { type: GraphQLString },
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            order: { type: GraphQLString },
            type: { type: GraphQLString },
            transport: { type: GraphQLString },
            messageId: { type: GraphQLString },
            chatId: { type: GraphQLString },
            userId: { type: GraphQLString },
            flag: { type: GraphQLString },
            inbound: { type: GraphQLBoolean }
          },
          resolve: resolver(Message)
        },

        records: {
          type: new GraphQLList(recordType),
          args: {
            chatbotId: { type: GraphQLString },
            order: { type: GraphQLString },
            type: { type: GraphQLString },
            status: { type: GraphQLString },
            userId: { type: GraphQLString },
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            longitude: { type: GraphQLFloat },
            latitude: { type: GraphQLFloat },
            precision: {
              type: GraphQLInt,
              description: 'Precision in meters to search around the coordinates'
            },
            where: { type: JSONType },
            ids: { type: new GraphQLList(GraphQLInt)}
          },
          resolve: (root, {
            order = 'createdAt',
            offset,
            limit,
            type,
            userId,
            status,
            latitude,
            longitude,
            where: rawWhere,
            precision = 100,
            ids,
            chatbotId
          }) => {
            const where = compactObject({ type, userId, status, chatbotId });
            if (longitude != null && latitude != null && precision > 9) {
              const [sw, ne] = geolib.getBoundsOfDistance({ latitude, longitude }, precision);
              where[Op.and] = [
                { 'latitude': { [Op.gte]: sw.latitude }},
                { 'latitude': { [Op.lte]: ne.latitude }},
                { 'longitude': { [Op.gte]: sw.longitude }},
                { 'longitude': { [Op.lte]: ne.longitude }},
              ]
            }
            if (_.isArray(ids) && !_.isEmpty(ids)) {
              where.id = { [Op.in]: ids };
            }

            const maybeJSON = str => {
              try {
                return JSON.parse(str);
              } catch(e) {
                return null;
              }
            }

            const translatedQuery = translateWhere(maybeJSON(rawWhere));
            return Record.findAll({
              limit,
              offset,
              order: splitOrder(order),
              where: { ...where, ...translatedQuery }
            });
          }
        },

        categories: {
          type: new GraphQLList(categoryType),
          args: {
            chatbotId: { type: GraphQLString },
            order: { type: GraphQLString },
            namespace: { type: GraphQLString },
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt }
          },
          resolve: (root, { order = 'name', offset, limit, namespace, chatbotId }) => {
            return Category.findAll({
              limit,
              offset,
              order: splitOrder(order),
              where: compactObject({
                namespace, chatbotId
              })
            });
          }
        },

        counters: {
          type: countersType,
          resolve: () => {
            return {};
          }
        },

        version: {
          type: GraphQLInt,
          resolve: () => 42
        }
      }
    }),


    subscription: new GraphQLObjectType({
      name: 'Subscriptions',
      fields: {
        deviceUpdated: {
          type: deviceType,
          subscribe: () => pubsub.asyncIterator('deviceUpdated'),
          args: {
            id: { type: GraphQLInt }
          },
          resolve: (payload) => {
            //console.log('payload', payload)
            return payload.device;
          },
        }
      }

    })

  });

  const graphQLServer = new ApolloServer({
    schema
  });

  return { graphQLServer, graphQLSchema: schema };
};
