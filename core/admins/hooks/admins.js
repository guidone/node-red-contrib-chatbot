import gql from 'graphql-tag';
import { useMutation } from 'react-apollo';

import withoutParams from '../../../src/helpers/without-params';

const DELETE_ADMIN = gql`
mutation($id: Int!) {
  deleteAdmin(id: $id) {
    id
  }
}`;

const EDIT_ADMIN = gql`
mutation($id: Int!, $admin: InputAdmin!) {
  editAdmin(id:$id, admin: $admin) {
    id,
    username,
    first_name,
    last_name,
    username,
    payload,
    permissions,
    chatbotIds,
    createdAt,
    email
  }
}`;

const CREATE_ADMIN = gql`
mutation($admin: InputAdmin!) {
  createAdmin(admin: $admin) {
    id,
    username,
    first_name,
    last_name,
    username,
    payload,
    permissions,
    chatbotIds,
    createdAt,
    email
  }
}`;

export default ({ onCompleted = () => {} } = {}) => {
  const [
    deleteAdmin,
    { loading: mutationLoading, error: mutationError },
  ] = useMutation(DELETE_ADMIN, { onCompleted });
  const [
    createAdmin,
    { loading: mutationCreateLoading, error: mutationCreateError },
  ] = useMutation(CREATE_ADMIN, { onCompleted });
  const [
    editAdmin,
    { loading: editLoading, error: editError },
  ] = useMutation(EDIT_ADMIN, { onCompleted });

  return {
    saving: mutationLoading || mutationLoading || mutationCreateLoading || editLoading,
    error: mutationError || editError || mutationCreateError,
    deleteAdmin,
    createAdmin,
    editAdmin: withoutParams(editAdmin, ['id', 'updatedAt', 'createdAt', '__typename'])
  };
};