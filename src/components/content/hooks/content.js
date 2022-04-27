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

  return {
    //bootstrapping,
    //loading: loading,
    saving: deleteLoading || createLoading || editLoading,
    error: deleteError || editError || createError,
    //data,
    deleteContent,
    createContent: withoutParams(createContent, ['id', 'updatedAt', 'createdAt', '__typename', 'cid', 'category']),
    editContent: withoutParams(editContent, ['id', 'updatedAt', 'createdAt', '__typename', 'cid', 'category']),
    //refetch
  };
};