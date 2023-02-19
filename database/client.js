const { ApolloClient, InMemoryCache, HttpLink } = require('@apollo/client');
const _ = require('lodash');
const fetch = require('node-fetch').default;

// DOCS: https://www.apollographql.com/docs/react/data/subscriptions/

module.exports = RED => {

  const cache = new InMemoryCache();
  const host = !_.isEmpty(RED.settings.uiHost) &  RED.settings.uiHost !== '0.0.0.0' ? RED.settings.uiHost : 'localhost';
  const apolloLink = new HttpLink({ uri: `http://${host}:${RED.settings.uiPort}/graphql`, fetch });

  return new ApolloClient({
    cache,
    link: apolloLink
  });
};