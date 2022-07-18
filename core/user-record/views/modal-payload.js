import React, { useState } from 'react';
import { Modal, Button } from 'rsuite';
import gql from 'graphql-tag';
import { useQuery, useMutation } from 'react-apollo'
import ReactJson from 'react-json-view'

//import WarningBox from '../../components/warning-box';
import useCanCloseModal from '../../../src/hooks/modal-can-close';
//import LoaderModal from '../../../src/components/loader-modal';
//import ShowError from '../show-error';

//import './style.scss';



const PayloadModal = ({ payload, disabled = false, onSubmit = () => {}, onCancel = () => {} }) => {
  const { handleCancel, isChanged, setIsChanged } = useCanCloseModal({ onCancel });
  const [current, setCurrent] = useState(payload);


  const handleChange = ({ updated_src: json }) => {
    setCurrent(json);
    setIsChanged(true);
  }
  //const error = loadingError || updateError;
  //const disabled = loading || saving;
  return (
    <Modal backdrop show onHide={() => handleCancel()} size="md" overflow={false} className="modal-user-record-payload">
      <Modal.Header>
        <Modal.Title>Payload</Modal.Title>
      </Modal.Header>
      <Modal.Body>


          <ReactJson
            src={current}
            onEdit={!disabled ? handleChange : undefined}
            onAdd={!disabled ? handleChange : undefined}
            onDelete={!disabled ? handleChange : undefined}
          />

      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => handleCancel()} appearance="subtle">
          Cancel
        </Button>
        <Button
          appearance="primary"
          disabled={disabled || !isChanged}
          appearance="primary"
          onClick={() => onSubmit(current)}
        >
          Update payload
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default PayloadModal;
