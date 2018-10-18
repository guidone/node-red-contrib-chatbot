const DialogBotSDK = node.context().global.get('DialogBot');

node.chat.onChatId(message => message.sender.peer.id);

node.chat.registerPlatform('dialog', 'Dialog');
node.chat.registerMessageType('message');
node.chat.registerMessageType('photo');
node.chat.registerMessageType('inline-buttons');

node.chat.onStart(function() {
  var chatServer = this;
  var options = this.getOptions();
  options.connector = new DialogBotSDK.Bot(options.token);
  options.connector.onMessage(function(peer, message) {
    console.log(message);  
    chatServer.receive(message);
  });
  options.connector.onInteractiveEvent(function(event) {
    chatServer.receive({
      mid: event.mid,
      sender: { 
        peer: { type: 'user', id: event.uid },
      },
      isOut: false,
      content: { 
        type: 'text', 
        text: event.value
      }
    });
  });
  
  return true;    
});

node.chat.in(function(message) {
  const chat = message.chat();
  if (message.originalMessage.content.type === 'text') {
    message.payload.type = 'message';
    message.payload.content = message.originalMessage.content.text;
    return Promise.resolve(chat.set('message', message.originalMessage.content.text))
      .then(() => message);
  }
  return message;  
});

node.chat.in(function(message) {
  const request = this.request;
  if (message.originalMessage.content.type === 'photo') {
    return request({ url: message.originalMessage.content.fileUrl})
      .then(image => {
        message.payload.type = 'photo';
        message.payload.content = image;  
        return message;
      });
  } 
  return message;    
});

// ensure the chatId is always a number, those inserted with the conversation
// node are string
node.chat.out(function(message) {
  if (message.payload.chatId != null && typeof message.payload.chatId === 'string') {
    message.payload.chatId = parseInt(message.payload.chatId, 10);
  } 
  return message;    
});

node.chat.out('message', function(message) {
  const bot = this.getConnector();
  const chat = message.chat();
  const peer = { type: 'user', id: message.payload.chatId };
  return new Promise(function(resolve, reject) {
    bot.sendTextMessage(peer, message.payload.content)
      .then(mid => chat.set('messageId', mid))
      .then(
        () => resolve(message),
        reject
      );      
  });
});

node.chat.out('inline-buttons', function(message) {
  const bot = this.getConnector();
  const chat = message.chat();
  const peer = { type: 'user', id: message.payload.chatId };
  
  const buttons = [{
    actions: message.payload.buttons
      .filter(button => button.type === 'postback')
      .map(button => ({
        id: button.value,
        widget: {
          type: 'button',
          value: button.value,
          label: button.label
        }
      }))
  }];
  return new Promise(function(resolve, reject) {
    bot.sendInteractiveMessage(peer, message.payload.content, buttons)
      .then(mid => chat.set('messageId', mid))
      .then(
        () => resolve(message),
        reject
      );  
  });
});
