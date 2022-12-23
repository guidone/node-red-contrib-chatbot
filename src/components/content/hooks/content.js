import gql from 'graphql-tag';
import { useMutation } from 'react-apollo';

import withoutParams from '../../../../src/helpers/without-params';

const DELETE_CONTENT = gql`
mutation($id: Int!) {
  deleteContent(id: $id) {
    id
  }
}`;

const EDIT_CONTENT = gql`
mutation($id: Int!, $content: InputContent!) {
  editContent(id: $id, content: $content) {
    id,
    slug,
    title,
    body,
    language,
    payload,
    fields {
      id,
      name,
      value,
      type
    }
  }
}
`;

const CREATE_CONTENT = gql`
mutation($content: InputContent!) {
  createContent(content: $content) {
    id,
    slug,
    title,
    body,
    language,
    payload,
    fields {
      id,
      name,
      value,
      type
    }
  }
}
`;

const SWAP_CONTENT = gql`
mutation($id: Int!, $withId: Int!) {
  swapContent(id: $id, withId: $withId) {
    id,
    order
  }
}
`;


export default ({ onCompleted = () => {} } = {}) => {
  const [
    deleteContent,
    { loading: deleteLoading, error: deleteError },
  ] = useMutation(DELETE_CONTENT, { onCompleted });
  const [
    createContent,
    { loading: createLoading, error: createError },
  ] = useMutation(CREATE_CONTENT, { onCompleted });
  const [
    editContent,
    { loading: editLoading, error: editError },
  ] = useMutation(EDIT_CONTENT, { onCompleted });
  const [
    swapOrder,
    { loading: swapLoading, error: swapError }
  ] = useMutation(SWAP_CONTENT, { onCompleted })

  return {
    //bootstrapping,
    //loading: loading,
    saving: deleteLoading || createLoading || editLoading || swapLoading,
    error: deleteError || editError || createError || swapError,
    //data,
    deleteContent,
    swapOrder,
    createContent: withoutParams(createContent, ['id', 'updatedAt', 'createdAt', '__typename', 'cid', 'category']),
    editContent: withoutParams(editContent, ['id', 'updatedAt', 'createdAt', '__typename', 'cid', 'category']),
    //refetch
  };
};