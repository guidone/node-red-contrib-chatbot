const _ = require('lodash')
const moment = require('moment');
const gql = require('graphql-tag');

const { graphQLError } = require('../../lib/lcd/index');
const { when } = require('../../lib/utils/index');
const Client = require('../../database/client');

const CREATE_MESSAGE = gql`
mutation($message: InputMessage!) {
  message: createMessage(message: $message) {
    id,
    chatId,
    user {
      username,
      userId,
      first_name,
      last_name,
      username,
      language,
      payload,
      createdAt,
      email
    }
  }
}
`;

const CREATE_MESSAGE_LIGHT = gql`
mutation($message: InputMessage!) {
  message: createMessage(message: $message) {
    id,
    chatId
  }
}
`;

const UPDATE_MESSAGE = gql`
mutation($messageId: String, $message: InputMessage!) {
  editMessage(messageId: $messageId, message: $message) {
    id,
    flag,
    content
  }
}
`;

module.exports = (RED) => {
  const client = Client(RED);

  return {
    storeInboundMessage: async (msg, node) => {
      // get chat context
      const chat = msg.chat();
      // get the data present in the chat context
      const {
        firstName,
        lastName,
        username,
        language
      } = await when(chat.get('firstName', 'lastName', 'username', 'language', 'userId'));

      const variables = {
        message: {
          user: {
            userId: msg.originalMessage.userId,
            first_name: firstName,
            last_name: lastName,
            username,
            language,
            chatbotId: msg.originalMessage.chatbotId,
          },
          chatId: String(msg.payload.chatId),
          messageId: msg.originalMessage.messageId != null ? String(msg.originalMessage.messageId) : undefined,
          chatbotId: msg.originalMessage.chatbotId,
          inbound: true,
          type: msg.payload.type,
          ts: moment(),
          transport: msg.originalMessage.transport,
          content: _.isString(msg.payload.content) ? msg.payload.content : '<buffer>'
        }
      };

      try {

        const result = await client
          .mutate({
            mutation: CREATE_MESSAGE,
            variables
          });

        // update the user information
        const user = result != null && result.data != null && result.data.message != null && result.data.message.user != null
          ? result.data.message.user : null;

        // if user data sent back, then syncronize the data present in chat context
        if (user != null) {
          // the DB is the single source of truth
          const update = { };
          if (!_.isEmpty(user.firstName) && firstName !== user.first_name) {
            update.firstName = user.first_name;
          }
          if (!_.isEmpty(user.lastName) && lastName !== user.last_name) {
            update.lastName = user.last_name;
          }
          if (!_.isEmpty(user.language) && language !== user.language) {
            update.language = user.language;
          }
          if (!_.isEmpty(user.username) && username !== user.username) {
            update.username = user.username;
          }
          // avoid next mc store tries to resolve again the user
          msg.originalMessage.resolved = true;
          // update chat context only if there are changes
          if (!_.isEmpty(update)) {
            await when(chat.set(update));
          }

          msg.user = user;
        }

      } catch(error) {
        graphQLError(error, node);
      }

    },

    storeOutboundMessage: async (msg, node) => {
      // nothing to do
      if (msg.sentMessage == null) {
        return;
      }
      // get chat context
      const chat = msg.chat();
      const userId = msg.get('userId');
      // get the data present in the chat context
      const {
        firstName,
        lastName,
        username,
        language
      } = await when(chat.get('firstName', 'lastName', 'username', 'language', 'userId'));

      // if the message is outbound and the user has already resolved by a mc_store upstream, then skip
      // the user sincronization is already been made, in order to optimize queries skip.
      // Of course always sync user for inbound messages
      //const inbound = false;
      const useSimplifiedQuery = msg.originalMessage.resolved === true;

      let variables;
      // get the flag param if any
      let flag = msg.sentMessage != null
        && msg.sentMessage.params != null
        && msg.sentMessage.params.messageFlag != null ?
        msg.sentMessage.params.messageFlag : null;

      variables = {
        message: {
          user: {
            userId: userId != null ? String(userId) : null,
            first_name: firstName,
            last_name: lastName,
            username,
            language
          },
          chatId: String(msg.sentMessage.chatId),
          messageId: msg.sentMessage.messageId ? String(msg.sentMessage.messageId) : undefined,
          inbound: false,
          type: msg.sentMessage.type,
          ts: moment(),
          transport: msg.sentMessage.transport || msg.originalMessage.transport,
          flag,
          content: _.isString(msg.sentMessage.content) ? msg.sentMessage.content : '<buffer>',
          chatbotId: msg.originalMessage.chatbotId
        }
      };

      try {
        // finally store the message
        await client
          .mutate({
            mutation: useSimplifiedQuery ? CREATE_MESSAGE_LIGHT : CREATE_MESSAGE,
            variables
          });

        // also mark with the same flag the original message
        if (!_.isEmpty(flag) && msg.originalMessage.messageId != null) {
          await client.mutate({
            mutation: UPDATE_MESSAGE,
            variables: {
              messageId: String(msg.originalMessage.messageId),
              message: {
                flag
              }
            }
          });
        }

      } catch(error) {
        graphQLError(error, node);
      }
    }
  }
};