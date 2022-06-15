const _ = require('lodash');
const gql = require('graphql-tag');

const Client = require('../database/client');
const lcd = require('../lib/lcd/index');

const { getChatbotId, getUserId } = require('../lib/helpers/utils');

const GET_USER = gql`
query($userId: String, $chatbotId: String) {
  user(userId: $userId, chatbotId: $chatbotId) {
    id,
    userId,
    payload
  }
}`;


const EDIT_USER = gql`
mutation($id: Int!, $user: InputUser!) {
  editUser(id:$id, user: $user) {
    id,
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
}`;

module.exports = function(RED) {
  const client = Client(RED);

  function MissionControlUserPayload(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.query = config.query;
    this.chain = config.chain;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const chatbotId = getChatbotId(msg);
      const userId = getUserId(msg);

      try {
        const response = await client.query({
          query: GET_USER,
          variables: { userId, chatbotId },
          fetchPolicy: 'network-only'
        });

        if (response.data != null && response.data.user != null) {
          // merge payload
          let payload = response.data.user.payload != null ? response.data.user.payload : {};
          payload = _.isObject(msg.payload) ? { ...payload, ...msg.payload } : payload;

          await client.mutate({
            mutation: EDIT_USER,
            variables: {
              id: response.data.user.id,
              user: {
                payload
              }
            }
          });
        }

        send(msg);
        done();
      } catch(error) {
        // format error
        // TODO: generalize query error
        if (error != null && error.networkError != null && error.networkError.result != null && error.networkError.result.errors != null) {
          let errors = error.networkError.result.errors.map(error => {
            let errorMsg = error.message;
            if (error.locations != null) {
              errorMsg += ` (line: ${error.locations[0].line})`;
            }
            return errorMsg;
          });
          lcd.dump(errors, `GraphQL Error (id: ${node.id})`);
        } else {
          lcd.dump('Unknown GraphQL error', `GraphQL Error (id: ${node.id})`);
          // eslint-disable-next-line no-console
          console.log(error);
        }
        done(error);
      }
    });
  }

  RED.nodes.registerType('mc-user-payload', MissionControlUserPayload);
};
