import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { FlexboxGrid, Modal, Button, FormGroup, ControlLabel, Form, FormControl } from 'rsuite';

import { /*SelectTransport,*/ UserAutocomplete, LanguagePicker } from '../../../src/components';
import { /*typeActiveChatbot,*/ typeUser } from '../../../src/types';

// TODO default user in user autocomplete

const SimulatorParamsModal = ({
  params,
  onCancel = () => {},
  onSubmit = () => {},
  disabled = false
}) => {
  const [formValue, setFormValue] = useState(params);

  return (
    <Modal
      backdrop
      show
      onHide={onCancel}
      keyboard={false}
      className="modal-simulator">
      <Modal.Header>
        <Modal.Title>Simulator Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          formValue={formValue}
          onChange={newFormValue => {
            const values = {...newFormValue};
            // if user changed and has a predefined language, then set the language
            if (newFormValue.user != null && (formValue.user == null || formValue.user.id !== newFormValue.user.id)
              && newFormValue.user.language) {
              values.language = newFormValue.user.language;
            }
            setFormValue(values);
          }}
          fluid
        >
        <FormGroup>
          <ControlLabel>Impersonated User</ControlLabel>
          <FormControl
            accepter={UserAutocomplete}
            name="user"
            placeholder="Test User"
            style={{ width: '100%' }}
          />
        </FormGroup>
        <FlexboxGrid justify="space-between" style={{ marginBottom: '20px' }}>
          <FlexboxGrid.Item colspan={11}>
            <FormGroup>
              <ControlLabel>Language</ControlLabel>
              <FormControl
                accepter={LanguagePicker}
                name="language"
                block
              />
          </FormGroup>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={11}>
            &nbsp;
          </FlexboxGrid.Item>
        </FlexboxGrid>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onCancel} appearance="subtle">
          Cancel
        </Button>
        <Button
          appearance="primary"
          disabled={disabled}
          onClick={() => onSubmit(formValue)}
        >
          Save configuration
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
SimulatorParamsModal.propTypes = {
  params: PropTypes.shape({
    language: PropTypes.string,
    user: typeUser,
    nodeId: PropTypes.string
  }),
  disabled: PropTypes.bool,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func
};

export default SimulatorParamsModal;