import _ from 'lodash';
import { useEffect, useReducer } from 'react';

import SocketListener from './lib/socket';
import getRoot from '../helpers/get-root';
import getNodeRedRoot from '../helpers/get-node-red-root';

const DEBUG_SOCKET = false;
let nodeRedSocketListener;

const useNodeRedSocket = ({
  reducer = () => {},
  initialState = {},
  onMessage = () => {}, // the raw message from Node-RED
  onReceive = () => {}  // the unbundled message from the RedBot wire
} = {}) => {
  const handler = (topic, payload) => {
    onMessage(topic, payload);
    if (DEBUG_SOCKET) {
      // eslint-disable-next-line no-console
      console.log('DEBUG WEB SOCKET:', topic, payload)
    }
    if (payload != null && !_.isEmpty(payload.topic)) {
      dispatch({ type: 'socket.message', topic: payload.topic, payload: payload.payload });
      onReceive(payload.topic, payload.payload);
    }
  };
  // connect socket
  useEffect(() => {
    if (nodeRedSocketListener == null) {
      const webSocketProtol = window.location.protocol.includes('https') ? 'wss' : 'ws';
      const wsUrl = `${webSocketProtol}://${window.location.hostname}:${window.location.port}${getNodeRedRoot()}/comms`
      // eslint-disable-next-line no-console
      console.log(`Created listening socket ${wsUrl}`);
      nodeRedSocketListener = new SocketListener({
        url: wsUrl,
        payloadField: 'data'
      });
    }
    nodeRedSocketListener.on('message', handler);
    return () => nodeRedSocketListener.off('message', handler);
  }, []);
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    state,
    dispatch,
    sendMessage: async (topic, payload) => {
      await fetch(`${getRoot()}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic,
          payload
        })
      });
    }
  };
}

export { useNodeRedSocket };