import React, { useState, useEffect } from 'react';
import { useApolloClient } from 'react-apollo';
import gql from 'graphql-tag';
import _ from 'lodash';

import UserAutocomplete from '../../../../src/components/user-autocomplete';

const GET_USER = gql`
query($userId: String!) {
  user(userId: $userId) {
    id,
    username,
    first_name,
    last_name,
    userId
  }
}
`;

const FilterUserAutocomplete = ({ defaultValue, onChange, ...rest }) => {
  const client = useApolloClient();
  const [user, setUser] = useState();

  // preload user detail if it's coming from url
  useEffect(() => {
    if (!_.isEmpty(defaultValue)) {
      client.query({ query: GET_USER, fetchPolicy: 'network-only', variables: { userId: defaultValue } })
        .then(response => {
          if (response != null && response.data != null && response.data.user != null) {
            setUser(response.data.user);
          }
        });
    }
  }, [])

  return (
    <UserAutocomplete
      {...rest}
      value={user}
      onChange={value => {
        setUser(value);
        onChange(value != null ? value.userId : undefined);
      }}
    />
  );
};

export default FilterUserAutocomplete;