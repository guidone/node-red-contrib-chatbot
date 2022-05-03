import React, { useState, useRef } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Modal, Button, Form, FormGroup, ControlLabel, FormControl, FlexboxGrid, Nav } from 'rsuite';

import JSONEditor from '../../../src/components/json-editor';
import Permissions from '../../../src/components/permissions';
import SelectChatbots from '../../../src/components/select-chatbots';
import PasswordInput from '../../../src/components/password-input';
import useCanCloseModal from '../../../src/hooks/modal-can-close';


import adminModel from '../model';

const ModalAdmin = ({ admin, onCancel = () => {}, onSubmit = () => {}, disabled = false }) => {
  const form = useRef();
  const { handleCancel, isChanged, setIsChanged } = useCanCloseModal({ onCancel });
  const [formValue, setFormValue] = useState({ ...admin, password: undefined });
  const [jsonValue, setJsonValue] = useState({
    json: !_.isEmpty(admin.payload) ? JSON.stringify(admin.payload, null, 2) : ''
  });
  const [formError, setFormError] = useState(null);
  const [tab, setTab] = useState('admin-details');

  const isNew = admin.id == null;

  return (
    <Modal backdrop show onHide={() => handleCancel()} size="md" overflow={false} className="modal-admin">
      <Modal.Header>
        <Modal.Title>Edit Admin <em>(id: {admin.id})</em></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Nav
          appearance="tabs"
          active={tab}
          onSelect={tab => {
            // tab is switched to manual edit of payload, make sure the current payload field is serialized
            // in serialized payload in order to show the updated one
            if (tab === 'admin-payload') {
              setJsonValue({
                json: !_.isEmpty(formValue.payload) ? JSON.stringify(formValue.payload, null, 2) : ''
              });
            }
            setTab(tab);
          }}
          activeKey={tab}
          style={{ marginBottom: '15px' }}
        >
          <Nav.Item eventKey="admin-details">Admin details</Nav.Item>
          <Nav.Item eventKey="admin-payload">Admin payload</Nav.Item>
        </Nav>
        {tab === 'admin-details' && (
          <Form
            ref={form}
            checkTrigger="none"
            model={adminModel}
            formValue={formValue}
            formError={formError}
            onCheck={errors => {
              if (formValue.id == null && _.isEmpty(formValue.password)) {
                errors = { ...errors, password: 'Password is required' };
              }
              setFormError(errors);
            }}
            onChange={formValue => {
              setIsChanged(true);
              setFormValue(formValue);
              setFormError(null);
            }}
            fluid autoComplete="off"
          >
            <FlexboxGrid justify="space-between" style={{ marginBottom: '20px' }}>
              <FlexboxGrid.Item colspan={11}>
                <FormGroup>
                  <ControlLabel>Username</ControlLabel>
                  <FormControl
                    disabled={disabled}
                    name="username" />
                </FormGroup>
              </FlexboxGrid.Item>
              <FlexboxGrid.Item colspan={11}>
                <FormGroup>
                  <ControlLabel>Password</ControlLabel>
                  <FormControl
                    disabled={disabled}
                    accepter={PasswordInput}
                    placeholder={!isNew ? 'something' : null}
                    name="password" />
                </FormGroup>
              </FlexboxGrid.Item>
            </FlexboxGrid>
            <FlexboxGrid justify="space-between" style={{ marginBottom: '20px' }}>
              <FlexboxGrid.Item colspan={11}>
                <FormGroup>
                  <ControlLabel>First Name</ControlLabel>
                  <FormControl autoComplete="off" disabled={disabled} name="first_name" />
                </FormGroup>
              </FlexboxGrid.Item>
              <FlexboxGrid.Item colspan={11}>
                <FormGroup>
                  <ControlLabel>Last Name</ControlLabel>
                  <FormControl disabled={disabled} name="last_name" />
                </FormGroup>
              </FlexboxGrid.Item>
            </FlexboxGrid>
            <FormGroup>
              <ControlLabel>Email</ControlLabel>
              <FormControl disabled={disabled} name="email" />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Permissions</ControlLabel>
              <FormControl
                disabled={disabled}
                name="permissions"
                accepter={Permissions}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Chatbots</ControlLabel>
              <FormControl
                disabled={disabled}
                name="chatbotIds"
                accepter={SelectChatbots}
              />
            </FormGroup>
          </Form>
        )}
        {tab === 'admin-payload' && (
          <Form
            formValue={jsonValue}
            formError={formError}
            fluid autoComplete="off"
          >
            <FormGroup>
              <ControlLabel>Payload</ControlLabel>
              <FormControl
                disabled={disabled}
                name="json"
                accepter={JSONEditor}
                onChange={json => {
                  if (!_.isEmpty(json)) {
                    let payload;
                    setJsonValue({ json });
                    try {
                      payload = JSON.parse(json);
                    } catch(e) {
                      // error do nothing
                      return;
                    }
                    setFormValue({ ...formValue, payload });
                    setIsChanged(true);
                  }
                }}
              />
            </FormGroup>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => handleCancel()} appearance="subtle">
          Cancel
        </Button>
        <Button
          appearance="primary"
          disabled={disabled || !isChanged}
          onClick={() => {
            if (!form.current.check()) {
              return;
            }
            onSubmit(formValue)
          }}
        >
          Save admin
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const TypeAdmin = PropTypes.shape({
  id: PropTypes.number,
  payload: PropTypes.object
});

ModalAdmin.propTypes = {
  admin: TypeAdmin,
  disabled: PropTypes.bool,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func
};

export default ModalAdmin;
