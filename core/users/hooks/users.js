import { useState } from 'react';
import gql from 'graphql-tag';
import { useQuery, useMutation } from 'react-apollo';

import withoutParams from '../../../src/helpers/without-params';

const USERS = gql`
query ($limit: Int, $offset: Int, $order: String, $username: String, $userId: String) {
  counters {
    users {
     count(username: $username, userId: $userId)
    }
  }
  users(limit: $limit, offset: $offset, order: $order, username: $username, userId: $userId) {
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
      id,
      transport,
      chatId
    }
  }
}
`;

const DELETE_USER = gql`
mutation($id: Int!) {
  deleteUser(id: $id) {
    id
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

export default ({ limit, page, onCompleted = () => {}, filters = {} } = {}) => {

  /*const { loading, error, data, refetch } = useQuery(USERS, {
    fetchPolicy: 'network-only',
    variables: {
      limit,
      offset: (page - 1) * limit,
      order: 'reverse:createdAt',
      username: !_.isEmpty(filters.username) ? filters.username : undefined,
      userId: !_.isEmpty(filters.userId) ? filters.userId : undefined
     },
     onCompleted: () => setBootstrapping(false)
  });
  const [bootstrapping, setBootstrapping] = useState(true);*/
  const [
    deleteUser,
    { loading: mutationLoading, error: mutationError },
  ] = useMutation(DELETE_USER, { onCompleted });
  const [
    editUser,
    { loading: editLoading, error: editError },
  ] = useMutation(EDIT_USER, { onCompleted });

  return {
    //bootstrapping,
    //loading,
    saving: mutationLoading || mutationLoading,
    error: mutationError || editError,

    deleteUser,
    editUser: withoutParams(editUser, ['id', 'updatedAt', 'createdAt', '__typename', 'chatIds'])

  };
};