import React, { useState, useCallback } from 'react';
import { Modal, Button, Form, FormGroup, ControlLabel, FormControl, FlexboxGrid, HelpBlock, Nav } from 'rsuite';

import { Views } from 'code-plug';
import JSONEditor from '../../../src/components/json-editor';
import LanguagePicker from '../../../src/components/language-picker';
import ChatIdsManager from '../../../src/components/chat-ids-manager';
import useCanCloseModal from '../../../src/hooks/modal-can-close';

const ModalUser = ({ user, onCancel = () => {}, onSubmit = () => {}, disabled = false }) => {
  const { handleCancel, isChanged, setIsChanged } = useCanCloseModal({ onCancel });
  const [formValue, setFormValue] = useState({ ...user });
  const [jsonValue, setJsonValue] = useState({
    json: !_.isEmpty(user.payload) ? JSON.stringify(user.payload, null, 2) : ''
  });
  const [formError, setFormError] = useState(null);
  const [tab, setTab] = useState('user-details');

  return (
    <Modal backdrop show onHide={() => handleCancel()} size="md" overflow={false} className="modal-user">
      <Modal.Header>
        <Modal.Title>Edit User <em>(id: {user.id})</em></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Nav
          appearance="tabs"
          active={tab}
          onSelect={tab => {
            // tab is switched to manual edit of payload, make sure the current payload field is serialized
            // in serialized payload in order to show the updated one
            if (tab === 'user-payload') {
              setJsonValue({
                json: !_.isEmpty(formValue.payload) ? JSON.stringify(formValue.payload, null, 2) : ''
              });
            }
            setTab(tab);
          }}
          activeKey={tab}
          style={{ marginBottom: '15px' }}
        >
          <Nav.Item eventKey="user-details">User details</Nav.Item>
          <Views region="user-tabs">
            {(View, { label, id}) => (
              <Nav.Item
                key={id}
                active={id === tab}
                eventKey={id}
                onSelect={() => setTab(id)}>
                {label}
              </Nav.Item>
            )}
          </Views>
          <Nav.Item eventKey="user-payload">User payload</Nav.Item>
        </Nav>
        {tab === 'user-details' && (
          <Form
            formValue={formValue}
            formError={formError}
            onChange={formValue => {
              setIsChanged(true);
              setFormValue(formValue);
              setFormError(null);
            }}
            fluid autoComplete="off"
          >
            <FormGroup className="chat-id">
              <ControlLabel>UserId</ControlLabel>
              <FormControl readOnly name="userId" className="user-id"/>
              <HelpBlock tooltip>userId cannot be modified for referencial integrity</HelpBlock>
            </FormGroup>
            <FlexboxGrid justify="space-between" style={{ marginBottom: '20px' }}>
              <FlexboxGrid.Item colspan={11}>
                <FormGroup>
                  <ControlLabel>First Name</ControlLabel>
                  <FormControl autoComplete="off" readOnly={disabled} name="first_name" />
                </FormGroup>
              </FlexboxGrid.Item>
              <FlexboxGrid.Item colspan={11}>
                <FormGroup>
                  <ControlLabel>Last Name</ControlLabel>
                  <FormControl readOnly={disabled} name="last_name" />
                </FormGroup>
              </FlexboxGrid.Item>
            </FlexboxGrid>
            <FlexboxGrid justify="space-between" style={{ marginBottom: '20px' }}>
              <FlexboxGrid.Item colspan={11}>
                <FormGroup>
                  <ControlLabel>Username</ControlLabel>
                  <FormControl readOnly={disabled} name="username" />
                </FormGroup>
              </FlexboxGrid.Item>
              <FlexboxGrid.Item colspan={11}>
                <FormGroup>
                  <ControlLabel>Language</ControlLabel>
                  <FormControl
                    readOnly={disabled}
                    name="language"
                    cleanable={false}
                    block
                    accepter={LanguagePicker}
                  />
                </FormGroup>
              </FlexboxGrid.Item>
            </FlexboxGrid>
            <FormGroup>
              <ControlLabel>Email</ControlLabel>
              <FormControl readOnly={disabled} name="email" />
            </FormGroup>
            <FormGroup>
              <ControlLabel>
                ChatIds
                <HelpBlock tooltip>
                  <em>chatId</em> is the unique identifier of a user on a specific platform, each user can have assigned multiple <em>chatIds</em>.
                  From the general list of users, it's possible to merge two users with different <em>chatIds</em> into the same identity.
                </HelpBlock>
              </ControlLabel>
              <FormControl
                readOnly={disabled}
                name="chatIds"
                accepter={ChatIdsManager}
              />
            </FormGroup>
          </Form>
        )}
        {tab === 'user-payload' && (
          <Form
            formValue={jsonValue}
            formError={formError}
            fluid autoComplete="off"
          >
            <FormGroup>
              <ControlLabel>Payload</ControlLabel>
              <FormControl
                readOnly={disabled}
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
        <Views region="user-tabs" key="user-tabs">
          {(View, { id }) => {
            if (id === tab) {
              return (
                <View
                  key={id}
                  formValue={formValue.payload}
                  onChange={payload => {
                    setFormValue({ ...formValue, payload });
                    setIsChanged(true);
                  }}
                />
              );
            }
            return <div key={id}/>;
          }}
        </Views>
      </Modal.Body>
      <Modal.Footer>
        <div className="custom-buttons">
          <Views region="user-button" user={user} />
        </div>
        <Button onClick={() => handleCancel()} appearance="subtle">
          Cancel
        </Button>
        <Button
          appearance="primary"
          disabled={disabled || !isChanged}
          appearance="primary"
          onClick={() => onSubmit(formValue)}
        >
          Save user
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalUser;
