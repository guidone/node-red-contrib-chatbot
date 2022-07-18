
const { ApolloClient } = require('apollo-boost');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { createHttpLink } = require('apollo-link-http');
const { ApolloLink, split } = require('apollo-link');
const { getMainDefinition } = require('apollo-utilities');
const { WebSocketLink } = require('apollo-link-ws');
const ws = require('ws');
const _ = require('lodash');
const fetch = require('node-fetch').default;



module.exports = RED => {
  const cache = new InMemoryCache();
  const host = !_.isEmpty(RED.settings.uiHost) ? RED.settings.uiHost : 'localhost';
  //console.log(`Opening client: http://${host}:${RED.settings.uiPort}/graphql`);
  const apolloLink = createHttpLink({ uri: `http://${host}:${RED.settings.uiPort}/graphql`, fetch: fetch });

  const wsLink = new WebSocketLink({
    uri: 'ws://localhost:1943/',
    options: {
      reconnect: true
    },
    webSocketImpl: ws
  });

  const link = split(
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    apolloLink,
  );

  return new ApolloClient({
    cache,
    link: ApolloLink.from([link])
  });
};