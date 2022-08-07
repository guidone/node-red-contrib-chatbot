import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import gravatar from 'gravatar';
import { Tooltip, Whisper, Header, Navbar, Dropdown, Nav, Icon, IconButton, Avatar, Notification } from 'rsuite';
import { useCodePlug } from 'code-plug';
import { useApolloClient } from 'react-apollo';
import { Link, useHistory } from 'react-router-dom';
import _ from 'lodash';
import useFetch from 'use-http';
import useCookie from 'react-use-cookie';

import AppContext from '../common/app-context';
import useCurrentUser from '../hooks/current-user';
import getRoot from '../helpers/get-root';

import ChatbotsSelector from './chatbots-selector';

const initials = user => {
  if (user.firstName != null && user.firstName.length !== 0 && user.lastName != null && user.lastName.length !== 0) {
    return user.firstName.substr(0, 1) + user.lastName.substr(0, 1);
  } else if (user.firstName != null && user.firstName.length !== 0 ) {
    return user.firstName.substr(0, 2);
  } else if (user.lastName != null && user.lastName.length !== 0) {
    return user.lastName.substr(0, 2);
  }
  return '';
}

const extendedName = user => {
  const names = [];
  if (!_.isEmpty(user.firstName)) {
    names.push(user.firstName);
  }
  if (!_.isEmpty(user.lastName)) {
    names.push(user.lastName);
  }
  return !_.isEmpty(names) ? names.join(' ') : user.username;
}

const sortBy = (a, b) => {
  if (a.order == null && b.order == null) {
    return 0;
  } else if (b.order == null) {
    return -1;
  } else if (a.order == null) {
    return 1;
  } else if (a.order < b.order) {
    return -1;
  } else if (a.order > b.order) {
    return 1;
  }
  return 0;
};

const GET_CHATBOT = gql`
query($chatbotId: String) {
  chatbot(chatbotId: $chatbotId) {
   	id,
    name,
    description,
    guid,
    chatbotId,
    plugins {
      id,
      plugin,
      version,
      filename
    }
  }
}`;

const AppHeader = () => {
  const [, setCookieChatbotId] = useCookie('chatbotId', '');
  const client = useApolloClient();
  const { post } = useFetch(`${getRoot()}/logout`);
  const { user } = useCurrentUser();
  const { state, dispatch } = useContext(AppContext);
  const history = useHistory();
  const { permissionQuery } = useCurrentUser();
  const { props: menu } = useCodePlug('menu', permissionQuery);
  const { needRestart } = state;

  return (
    <Header className="mc-header">
      <Navbar appearance="inverse">
        <Navbar.Body>
          <Nav>
            <Nav.Item renderItem={() => <Link className="rs-nav-item-content" to="/">Home</Link>} />
            {menu
              .sort(sortBy)
              .map(({ label, url, id }) => {
                return (
                  <Nav.Item
                    key={id}
                    renderItem={() => <Link className="rs-nav-item-content" to={url}>{label}</Link>}
                  />
                );
              })
            }
          </Nav>
          <Nav pullRight>
            <ChatbotsSelector
              chatbots={state.chatbots}
              value={state.chatbotId}
              onChange={async chatbotId => {
                // fetch new chatbot
                const result = await client.query({ query: GET_CHATBOT, fetchPolicy: 'network-only', variables: { chatbotId: chatbotId } });
                if (result.data?.chatbot != null) {
                  dispatch({ type: 'selectChatbot', chatbot: result.data.chatbot });
                  setCookieChatbotId(chatbotId);
                  //setChatbotId(chatbotId);
                } else {
                  Notification.error({
                    placement: 'topStart',
                    title: 'Error',
                    description: `Something went wrong trying to switch to chatbot "${chatbotId}"`
                  });
                }
              }}
            />
            {user.isEmptyPassword && (
              <Whisper
                placement="left"
                trigger="hover"
                speaker={<Tooltip>Current user has no password!</Tooltip>}
              >
                <IconButton
                  circle
                  style={{ marginTop: '7px', marginRight: '7px'}}
                  color="red"
                  size="lg"
                  onClick={() => history.push('/admins')}
                  icon={<Icon icon="exclamation-triangle" />}
                />
              </Whisper>
            )}
            {needRestart && (
              <Whisper
                placement="left"
                trigger="hover"
                speaker={<Tooltip>Reload page to see installed plugins</Tooltip>}
              >
                <IconButton
                  circle
                  style={{ marginTop: '7px', marginRight: '7px'}}
                  color="red"
                  size="lg"
                  onClick={() => window.location.reload()}
                  icon={<Icon icon="refresh" />}
                />
              </Whisper>
            )}
            <Dropdown
              className="mc-avatar"
              placement="bottomEnd"
              renderTitle={()=> (
                <Avatar src={user.avatar || gravatar.url(user.email)} circle>{initials(user)}</Avatar>)}
            >
              <Dropdown.Item><b>{extendedName(user)}</b></Dropdown.Item>
              <Dropdown.Item
                target="_blank"
                href="/"
                >Node-RED</Dropdown.Item>
              <Dropdown.Item divider />
              <Dropdown.Item
                onSelect={async () => {
                  await post();
                  window.location.reload();
                }}
              >Logout</Dropdown.Item>
            </Dropdown>
          </Nav>
        </Navbar.Body>
      </Navbar>
    </Header>
  );
}
AppHeader.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    avatar: PropTypes.string,
    email: PropTypes.string
  })
};

export default AppHeader;