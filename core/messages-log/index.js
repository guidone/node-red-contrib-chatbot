import React, { Fragment } from 'react';
import _ from 'lodash';
import moment from 'moment';
import { Icon, IconButton, Tag, List, FlexboxGrid } from 'rsuite';

import { plug } from 'code-plug';
import Panel from '../../src/components/grid-panel';
import { useNodeRedSocket } from '../../src/hooks/socket';

import MessageList from './views/message-list';
import './message-log.scss';


const handleMessages = (state, action) => {
  switch(action.type) {
    case 'socket.message':
      if (action.topic === 'message.out') {
        const payload = _.isArray(action.payload) ? action.payload : [action.payload];
        const messages = payload.map(message => ({ ...message, ts: moment() }));
        const messageOutLog = state.messageOutLog != null ? [...messages, ...state.messageOutLog] : messages;
        return {
          ...state,
          messageOutLog
        };
      } else if (action.topic === 'message.in') {
        const payload = _.isArray(action.payload) ? action.payload : [action.payload];
        const messages = payload.map(message => ({ ...message, ts: moment() }));
        const messageInLog = state.messageInLog != null ? [...messages, ...state.messageInLog] : messages;
        return {
          ...state,
          messageInLog
        };
      }
      return state;
    case 'clear-out':
      return {
        ...state,
        messageOutLog: []
      };
    case 'clear-in':
      return {
        ...state,
        messageInLog: []
      };
    default:
      return state;
  }
};


const MessageOutLogWidget = () => {
  const { state, dispatch } = useNodeRedSocket({ reducer: handleMessages, initialState: { messageOutLog: [] }});
  const { messageOutLog } = state;

  return (
    <Panel
      title="Outbound Message Log"
      className="widget-message-log"
      hint={`To see outgoing messages here, set a MC Output node with topic "message.out" in the Node-RED flow in a way that
        receives the same input of the Sender nodes`}
      menu={<IconButton onClick={() => dispatch({ type: 'clear-out' })} appearance="link" icon={<Icon icon="trash"/>} size="md"/>}
      scrollable
    >
      {messageOutLog.length === 0 && (
        <Panel.Empty>No messages</Panel.Empty>
      )}
      {messageOutLog.length !== 0 && <MessageList messages={messageOutLog} />}
    </Panel>
  );
}

const MessageInLogWidget = () => {
  const { state, dispatch } = useNodeRedSocket({
    reducer: handleMessages,
    initialState: { messageInLog: [] }
  });
  const { messageInLog } = state;

  return (
    <Panel
      title="Inbound Message Log"
      className="widget-message-log"
      hint={`To see ingoing messages here, set a MC Output node with topic "message.in" in the Node-RED flow in a way that
        receives the same output of the Receiver nodes`}
      menu={<IconButton onClick={() => dispatch({ type: 'clear-in' })} appearance="link" icon={<Icon icon="trash"/>} size="md"/>}
      scrollable
    >
      {messageInLog.length === 0 && (
        <Panel.Empty>No messages</Panel.Empty>
      )}
      {messageInLog.length !== 0 && <MessageList messages={messageInLog} />}
    </Panel>
  );
}

plug('widgets', MessageOutLogWidget, { x: 0, y: 0, w: 2, h: 4, minW: 2, isResizable: true, id: 'message-out-log' })
plug('widgets', MessageInLogWidget, { x: 0, y: 0, w: 2, h: 4, minW: 2, isResizable: true, id: 'message-in-log' })
