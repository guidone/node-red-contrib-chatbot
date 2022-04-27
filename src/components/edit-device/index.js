
import React, { useState, useCallback } from 'react';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';

import { Modal, Tooltip, Whisper, Icon, Button } from 'rsuite';
import SchemaForm, { validate } from '../../../src/components/schema-form';
import ShowError from '../../../src/components/show-error';
import modalCanClose from '../../../src/hooks/modal-can-close';

const EDIT_DEVICE = gql`
mutation($id: Int!, $device: NewDevice!) {
  editDevice(id: $id, device: $device) {
    id,
    name,
    payload,
    createdAt,
    updatedAt,
    status,
    lat,
    lon,
    jsonSchema,
    version,
    lastUpdate,
    snapshot
  }
}
`;



const EditDevice = ({
  jsonSchema,
  value,
  path,
  children,
  tooltip,
  title,
  skipValidation = false,
  placement = 'top'
}) => {
  const [state, setState] = useState({ editing: false, value: null });
  const onCancel = useCallback(() => setState({ editing: false, value: null }));
  const { handleCancel, setIsChanged } = modalCanClose({ onCancel });

  const [
    editDevice,
    { loading, error },
  ] = useMutation(EDIT_DEVICE, {
    onCompleted: () => setState({ editing: false, value: null })
  });

  if (state.editing) {
    return (
      <Modal backdrop show onHide={handleCancel} size="sm" overflow={false} className="modal-edit-schema">
        <Modal.Header>
          <Modal.Title>{!_.isEmpty(title) ? title : 'Edit'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error != null && <ShowError error={error}/>}
          <SchemaForm
            value={state.value}
            jsonSchema={jsonSchema}
            path={path}
            errors={state.errors}
            disabled={loading}
            hideTitles={true}
            onChange={value => {
              setState({ ...state, value, errors: undefined });
              setIsChanged(true);
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={handleCancel}
            appearance="subtle"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            disabled={loading}
            appearance="primary"
            onClick={() => {
              const errors = validate(state.value, jsonSchema, path);
              if (!skipValidation && !_.isEmpty(errors)) {
                setState({ ...state, errors });
              } else {
                editDevice({ variables: { id: value.id, device: { payload: state.value } } });
              }
            }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    );
  } else {
    const link = (
      <a
        style={{ display: 'inline-block' }}
        className="ui-edit-schema-button"
        href="#"
        onClick={e => {
          e.preventDefault();
          setState({ editing: true, value: value.payload });
        }}
      >
        <Icon icon="edit2"/>
      </a>
    );

    if (!_.isEmpty(tooltip)) {
      return (
        <Whisper trigger="hover" placement={placement} speaker={<Tooltip>{tooltip}</Tooltip>}>
          <span>{link}</span>
        </Whisper>
      );
    }
    return link;
  }
}

export default EditDevice;