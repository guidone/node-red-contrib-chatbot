import { useMemo} from 'react';
import { InMemoryCache, HttpLink, ApolloClient, ApolloLink } from '@apollo/client';

// DOCS: connecting web socket
// https://www.apollographql.com/docs/react/data/subscriptions/

// eslint-disable-next-line no-unused-vars
export default _settings => {
  const client = useMemo(() => {
    const cache = new InMemoryCache(); // where current data is stored
    const apolloLink = new HttpLink({ uri: '/graphql' });

    return new ApolloClient({
      cache,
      link: ApolloLink.from([apolloLink])
    });
  }, []);
  return client;
};
