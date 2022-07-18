import { useMemo} from 'react';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';

export default _settings => {
  const client = useMemo(() => {
    const cache = new InMemoryCache(); // where current data is stored
    const apolloLink = createHttpLink({ uri: '/graphql' });

    return new ApolloClient({
      cache,
      link: ApolloLink.from([apolloLink])
    });
  }, []);

  return client;
};