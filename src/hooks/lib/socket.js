import Sockette from 'sockette';
import _ from 'lodash';

const SocketListener = function({
  url,
  maxAttempts = 10,
  timeout = 5e3,
  payloadField = 'payload'
}) {

  let listeners = {};
  const execute = (name, ...params) => {
    if (listeners[name] != null) {
      listeners[name].forEach(callback => callback(...params));
    }
  };
  const ws = new Sockette(url, {
    timeout,
    maxAttempts,
    onmessage: e => {
      let message;
      try {
        message = JSON.parse(e.data);
      } catch(e) {
        // do nothing
      }
      if (Array.isArray(message)) {
        message.forEach(msg => execute('message', msg.topic, msg[payloadField]))
      } else {
        execute('message', message.topic, message[payloadField]);
      }
    },
    onerror: e => {
      // eslint-disable-next-line no-console
      console.log('connect error', e)
    },
    onmaximum: e => {
      // eslint-disable-next-line no-console
      console.log('connect error', e)
    },
    onreconnect: () => execute('reconnect'),
    onclose: () => execute('close'),
    onopen: () => {
      const raw = localStorage.getItem('auth-tokens');
      let json;
      try {
        json = JSON.parse(raw)
      } catch(e) {
        // do nothing
      }
      if (json != null && !_.isEmpty(json.access_token)) {
        ws.send(`{"auth":"${json.access_token}"}`);
      }

      execute('open');
    }
  });

  const obj = {
    on(name, callback) {
      if (listeners[name] == null) {
        listeners[name] = [];
      }
      listeners[name].push(callback);
      return obj;
    },
    off(name, callback) {
      if (listeners[name] != null) {
        listeners[name] = listeners[name].filter(current => current !== callback);
      }
      return obj;
    },
    close() {
      listeners = {};
      ws.close();
      return obj;
    },
    send(str) {
      ws.send(str);
      return obj;
    }
  };

  return obj;
};

export default SocketListener;