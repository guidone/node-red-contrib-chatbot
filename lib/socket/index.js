import Sockette from 'sockette';

const SocketListener = function({ url, maxAttempts = 10, timeout = 5e3 }) {

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
      execute('message', message.topic, message.payload);
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
    onopen: () => execute('open')
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