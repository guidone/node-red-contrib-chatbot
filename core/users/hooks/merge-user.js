import React, { useState } from 'react';
import { useMutation } from 'react-apollo';
import _ from 'lodash';
import { Modal, FormGroup, ControlLabel, FormControl, HelpBlock, Form, Button } from 'rsuite';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

import useMCContext from '../../../src/hooks/mc-context';

import UserAutocomplete from '../../../src/components/user-autocomplete';
import Transport from '../../../src/components/transport';

const UserLabel = ({ user }) => {
  if (!_.isEmpty(user.first_name) || !_.isEmpty(user.last_name)) {
    return (
      <span>
        <b>{[user.first_name, user.last_name].filter(s => !_.isEmpty(s)).join(' ')}</b>
        &nbsp;
        <em>(id: {user.id})</em>
      </span>
    );
  } else if (!_.isEmpty(user.username)) {
    return (
      <span>
        <b>{user.username}</b>
        &nbsp;
        <em>(id: {user.id})</em>
      </span>
    );
  } else {
    return (
      <span>
        <b>Anonymous</b>
        &nbsp;
        <em>(id: {user.id})</em>
      </span>
    );
  }
};
UserLabel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    userId: PropTypes.string,
    chatIds: PropTypes.arrayOf(PropTypes.shape({
      chatId: PropTypes.string,
      transport: PropTypes.string
    }))
  })
};


const MERGE_USER = gql`
mutation($fromId: Int!, $toId: Int!, $chatbotId: String!) {
  user: mergeUser(fromId: $fromId, toId: $toId, chatbotId: $chatbotId) {
    id,
    username,
    userId,
    first_name,
    last_name,
    username,
    language,
    payload,
    createdAt,
    email,
    chatIds {
      id,
      transport,
      chatId
    }
  }
}`;

const MergeModal = ({
  user,
  onCancel = () => {},
  onSubmit = () => {},
  disabled = false
}) => {
  const [formValue, setFormValue] = useState({});
  const [formError, setFormError] = useState(null);

  return (
    <Modal backdrop show onHide={onCancel} size="sm" overflow={false} className="modal-merge-user">
      <Modal.Header>
        <Modal.Title>Merge User <em>"{user.userId}"</em></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          formValue={formValue}
          formError={formError}
          onChange={formValue => {
            setFormValue(formValue);
            setFormError(null);
          }}
          fluid autoComplete="off"
        >
          <FormGroup>
            <ControlLabel>User to merge to</ControlLabel>
            <FormControl
              disabled={disabled}
              name="intoUser"
              excludeIds={[user.id]}
              accepter={UserAutocomplete}
            />
            <HelpBlock>
              This will merge the user <UserLabel user={user} /> into the selected user. Fields like <em>email</em>,
              <em> first_name</em>, <em>last_name</em>, <em>username</em>, <em>language</em> will be copied into
              the destination user (if empty), the <em>chatIds</em> for the platform{user.chatIds.length > 1 ? 's' : ''}
              &nbsp;<span>{user.chatIds.map(item => <Transport key={item.transport} transport={item.transport}/>)}</span>&nbsp;
              will be assigned to the destination user (if not already defined).
              <br/>
              <strong className="warning">The operation is irreversible!</strong>
            </HelpBlock>
          </FormGroup>

        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onCancel} appearance="subtle">
          Cancel
        </Button>
        <Button
          appearance="primary"
          disabled={disabled || formValue.intoUser == null}
          onClick={() => {
            if (confirm('Confirm to merge the user? The operation cannot be undone')) {
              onSubmit(formValue);
            }
          }}
        >
          Merge user
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
MergeModal.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    userId: PropTypes.string,
    chatIds: PropTypes.arrayOf(PropTypes.shape({
      chatId: PropTypes.string,
      transport: PropTypes.string
    }))
  }),
  disabled: PropTypes.bool,
  onCompleted: PropTypes.func,
  onCancel: PropTypes.func
};


export default ({ onComplete = () => {} }) => {
  const [user, setUser] = useState(null);
  const { state } = useMCContext();
  const [
    mergeUser,
    { loading: merging },
  ] = useMutation(MERGE_USER, {
    onCompleted: () => {
      setUser(null);
      onComplete();
    }
  });

  let mergeModal;
  if (user != null) {
    mergeModal = (
      <MergeModal
        user={user}
        onCancel={() => setUser(null)}
        disabled={merging}
        onSubmit={({ intoUser }) => {
          mergeUser({ variables: {
            fromId: user.id,
            toId: intoUser.id,
            chatbotId: state.chatbotId
          }});
        }}
      />
    );
  }

  return {
    mergeUser: setUser,
    mergeModal
  };
};