import React, { useState } from 'react';
import { Modal, Button } from 'rsuite';
import gql from 'graphql-tag';
import { useQuery, useMutation } from 'react-apollo'
import ReactJson from 'react-json-view'

import WarningBox from '../../components/warning-box';
import useCanCloseModal from '../../../src/hooks/modal-can-close';
import LoaderModal from '../../../src/components/loader-modal';
import ShowError from '../show-error';

import './style.scss';

const USER = gql`
query($id: Int!) {
  user(id: $id) {
    id,
    userId,
    context
  }
}`;

const UPDATE_CONTEXT = gql`
mutation($id: Int!, $user: InputUser!) {
  editUser(id: $id, user: $user) {
    id,
    context
  }
}
`;

const ContextModal = ({ user, onSubmit = () => {}, onCancel = () => {} }) => {
  const { handleCancel, isChanged, setIsChanged } = useCanCloseModal({ onCancel });
  const [context, setContext] = useState();
  const { loading, error: loadingError } = useQuery(USER, {
    fetchPolicy: 'network-only',
    variables: { id: user.id },
    onCompleted: data => {
      if (data.user != null) {
        setContext(data.user.context);
      }
    }
  });
  const [ updateContext, { loading: saving, error: updateError }] = useMutation(UPDATE_CONTEXT, {
    onCompleted: () => onSubmit()
  });

  const handleChange = ({ updated_src: json }) => {
    setContext(json);
    setIsChanged(true);
  }
  const error = loadingError || updateError;
  const disabled = loading || saving;
  return (
    <Modal backdrop show onHide={() => handleCancel()} size="md" overflow={false} className="modal-context">
      <Modal.Header>
        <Modal.Title>Context <em>(id: {user.id})</em></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <LoaderModal/>}
        {error && <ShowError error={error} />}
        {!loading && !error && context == null && (
          <WarningBox
            icon="database"
            title="No Context"
            hover="ban"
          >
            Context is not available for this user.<br />
            This happens if the chatbot uses a Memory or Plain File context provider or the SQLite proivders are
            running on a different database of Mission Control
          </WarningBox>
        )}
        {!loading && context != null && (
          <ReactJson
            src={context}
            onEdit={!disabled ? handleChange : undefined}
            onAdd={!disabled ? handleChange : undefined}
            onDelete={!disabled ? handleChange : undefined}
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => handleCancel()} appearance="subtle">
          Cancel
        </Button>
        <Button
          appearance="primary"
          disabled={disabled || !isChanged}
          appearance="primary"
          onClick={() => updateContext({ variables: { id: user.id, user: { context } } })}
        >
          Save context
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ContextModal;
