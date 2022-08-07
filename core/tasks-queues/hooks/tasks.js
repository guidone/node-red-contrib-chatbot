import gql from 'graphql-tag';
import { useMutation } from 'react-apollo';

import withoutParams from '../../../src/helpers/without-params';

const DELETE_TASK = gql`
mutation($id: Int!, $queue: String!) {
  deleteTask(id: $id, queue: $queue) {
    id
  }
}
`;

const EDIT_ADMIN = gql`
mutation($id: Int!, $queue: String!, $task: InputTask!) {
  updateTask(id:$id, queue: $queue, task: $task) {
    id,
    taskId,
    task,
    createdAt,
    priority
  }
}`;

export default ({ onCompleted = () => {} } = {}) => {
  const [
    deleteTask,
    { loading: mutationLoading, error: mutationError },
  ] = useMutation(DELETE_TASK, { onCompleted });
  const [
    editTask,
    { loading: editLoading, error: editError },
  ] = useMutation(EDIT_ADMIN, { onCompleted });

  return {
    saving: mutationLoading || mutationLoading || editLoading,
    error: mutationError || editError,
    deleteTask,
    editTask: withoutParams(editTask, ['id', 'updatedAt', 'createdAt', '__typename'])
  };
};