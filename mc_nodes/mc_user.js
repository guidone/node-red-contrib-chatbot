const _ = require('lodash');
const gql = require('graphql-tag');

const Client = require('../database/client');
const lcd = require('../lib/lcd/index');

const {
  getTransport,
  getChatId,
  when,
  isValidMessage
} = require('../lib/helpers/utils');

const GET_USER = gql`
query($chatId: String, $transport: String) {
  chatIds(chatId: $chatId, transport: $transport) {
    transport,
    user {
      id,
      username,
      userId,
      first_name,
      last_name,
      username,
      language,
      payload,
      createdAt,
      email,
      chatIds {
        chatId,
        transport
      }
    }
  }
}`;

module.exports = function(RED) {
  const client = Client(RED);

  function MissionControlUser(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.query = config.query;
    this.chain = config.chain;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      // check if valid redbot message or simulator, pass thru
      if (!isValidMessage(msg, node)) {
        return;
      }

      const chatId = getChatId(msg);
      const transport = getTransport(msg);
      const chat = msg.chat();

      try {
        // get data from context
        const { firstName, lastName, language, userId } = await when(chat.get('firstName', 'lastName', 'language'));

        // get user data from DB
        const response = await client.query({
          query: GET_USER,
          variables: { chatId: String(chatId), transport },
          fetchPolicy: 'network-only'
        });

        const user = response.data != null && !_.isEmpty(response.data.chatIds) ? response.data.chatIds[0].user : null;
        // reflect back changes to context
        if (user != null) {
          // TODO update userId
          // the DB is the single source of truth
          const update = {};
          if (firstName !== user.first_name) {
            update.firstName = user.first_name;
          }
          if (lastName !== user.last_name) {
            update.lastName = user.last_name;
          }
          if (language !== user.language) {
            update.language = user.language;
          }
          if (userId !== user.userId) {
            update.userId = user.userId;
          }

          // update chat context only if there are changes
          if (!_.isEmpty(update)) {
            await when(chat.set(update));
          }
        }

        send({ ...msg, user });
        done();
      } catch(error) {
        done(error);
      }
    });
  }

  RED.nodes.registerType('mc-user', MissionControlUser);
};
