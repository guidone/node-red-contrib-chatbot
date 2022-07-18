import gql from 'graphql-tag';
import { useMutation } from 'react-apollo';

const DELETE_RECORD = gql`
mutation($id: Int!) {
  deleteRecord(id: $id) {
    id
  }
}`;

export default ({ onCompleted = () => {} } = {}) => {
  const [
    deleteRecord,
    { loading: deleteLoading, error: deleteError },
  ] = useMutation(DELETE_RECORD, { onCompleted });

  return {
    saving: deleteLoading,
    error: deleteError,
    deleteRecord
  };
};