
//const { ApolloClient } = require('apollo-boost');
//const { InMemoryCache } = require('apollo-cache-inmemory');
//const { createHttpLink } = require('apollo-link-http');
//const { ApolloLink, split } = require('apollo-link');
//const { getMainDefinition } = require('apollo-utilities');
//const { WebSocketLink } = require('apollo-link-ws');

const { split, HttpLink } = require('@apollo/client');
const { getMainDefinition } = require('@apollo/client/utilities');
const { GraphQLWsLink } = require('@apollo/client/link/subscriptions');
const { createClient } = require('graphql-ws');

const { ApolloClient, InMemoryCache   } = require('@apollo/client');

const ws = require('ws');
const _ = require('lodash');
//const fetch = require('node-fetch').default;

const fetch = require('cross-fetch');

// DOCS: https://www.apollographql.com/docs/react/data/subscriptions/

module.exports = RED => {

  const cache = new InMemoryCache();
  const host = !_.isEmpty(RED.settings.uiHost) &  RED.settings.uiHost !== '0.0.0.0' ? RED.settings.uiHost : 'localhost';
  const apolloLink = new HttpLink({ uri: `http://${host}:${RED.settings.uiPort}/graphql`, fetch });

  const wsLink = new GraphQLWsLink(createClient({
    url: 'ws://localhost:1943/',
    // TODO check
    /*options: {
      reconnect: true
    },*/
    webSocketImpl: ws
  }));

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
    link
  });
};