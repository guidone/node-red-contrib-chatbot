
At the heart of **RedBot** there’s _chat-platform.js_, a library to translate messages from different platform (**Telegram**, **Slack**, **Facebook Messenger**, etc) to common payloads in order to be used inside **Node-RED**. In this way a text message containing _“Hello world!”_ from **Facebook** or **Telegram** will be translated into the same payload by the receiver nodes and injected into the flow, the answer to this message (_“Hello to you!”_) will be then translated and sent back to the platform using the appropriate API call.

The _chat-platform.js_ it’s a kind of framework to build connectors for different platforms, it provides basic functionalities (like handling the chat context, etc) while the implementation details for the specific platform is delegated to chunk of codes called _middlewares_. It’s very similar to **Express.js** in it’s philosophy, a middleware is something like this

```javascript
node.chat.in(message => {  
  return new Promise((resolve, reject) => {    
    if (message.type === 'my-type') {      
      // do something      
      resolve(message);    
     }  
  });
});
```

A _middleware_ is a function that returns a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), it receives a message as argument and - in general - resolves the promise with a message or, if an error occurred during the computation, it rejects with an error.

The implementation of chat connector with _chat-platform.js_ consists in two chains of middlewares, one for inbound messages and one for outbound messages, that are executed sequentially when a message is received **from** the chat platform and when a message is to be sent **to** the chat platform.

Each middleware generally takes care of one type of message. Keeping up with all chat platform’s API is hard, for this reason keeping the code small, modular and easy to maintain is vital. For example a middleware that handles incoming photo message could be something like this:

```javascript
node.chat.in(message => {  
  return new Promise((resolve, reject) => {    
    if (message.originalMessage.type === 'picture' && 
        message.originalMessage.url != null
		) {      
			fetch(message.originalMessage.url)        
				.then(
					buffer => {            
						message.payload.content = buffer;            
						message.payload.type = 'photo';            
						resolve(message);          
					}, 
					error => reject(`Error downloading ${message.originalMessage.url}`)        
				);    
		} else {      
			resolve(message);    
		}  
	});
});
```

The `message` variable contains the **Node-RED** message that will go out of the node receiver, this middleware has to detect if the incoming message is a picture, in that case it has to download the photo file and store the retrieved data in a message attribute otherwise let the message flow through the next middleware (the _.resolve()_ in the _else_ block).

The received payload is always stored in the `originalMessage` key of the message, the content depends on the specific chat platform we’re dealing with and it’s usually where the middleware would sniff for particular keys to try to understand which kind of message is arrived. In case the middleware decides to handle the message, it has to 1. store the content of the message (a string, a buffer, etc.) in the key `message.payload.content` 2. assign a type to the message, _RedBot_ supports a number of types out of the box (_audio_, _buttons_, _command_, _contact_, _dialog_, _document_, _inline-buttons_, _inline-query_, _invoice_, _invoice-shipping_, _location_, _message_, _photo_, _payment_, _request_, _response_, _video_), but new types can be defined in order to expand the platform. 3. resolve the promise with the new message

In case a middleware has handled a message (it has changed the type with `message.payload.type = 'a-type';`), the rest of the inbound chain of middlewares will be skipped since the incoming message has been already _resolved_. In case of fatal error, like a broken link, a proper error must be raised with `reject(my_error)`: the error will be shown in the system console and the **Node-RED** debug panel, so it should be verbose enough to understand want went wrong.

In case the `Extend node` is used to add a custom message type (like in the first example), it’s recommended to register the message type with

```javascript
node.chat.registerMessageType('my-type', 'My Type');
```

in this way the new message type will appear in the drop down menu of the `Rules node`.

In a very similar way works the outbound chain: in order to extend the chat platform to support a new message type for example _bitcoin_:

```javascript
node.chat.out('bitcoin', message => {  
	return new Promise((resolve, reject) => {    
		fetch(`http://transfer-bitcoin.ahah/to/${message.payload.chatId}`, { 
			amount: message.payload.content 
		}).then(          
			() => resolve(message),          
			error => reject(`Not enough funds`)        
		);  
	});
});
```

The outbound chain of middleware it’s different since it accepts also a `type`: the middleware will be executed only for this kind of messages, in this case the middleware should 1. execute the specific API call using the `message.payload.chatId` and `message.payload.content` 2. resolve the message when the operation is completed

The value of `message.payload.chatId` is filled by _chat-platform.js_ and it’s a unique identifier of the user in the chat platform (it could be a string or a number, depends on the chat platform implementation), `message.payload.content` is the content of the message (in this example the amount of bitcoin).

The _message_ variable is the **Node-RED** object that runs through the flow, so for example it’s possible to access the chat context in the same way as in `Function node`:

```javascript
node.chat.out(message => {  
	var chat = message.chat();  
	return new Promise((resolve, reject) => {    
		chat.set('lastMessageSent', (new Date).toString())      
			.then(resolve)      
			.catch(e => reject('Error on storing the timestamp'));  
	});
});
```

The `.out()` method without a type as argument will be executed for all message types, in this example a timestamp is stored in the chat context for all outgoing messages. It’s important to always resolve or reject the promise to pass the control to the next middleware or break the chain with an meaningful error, failing to do this, the message will never reach the API.

These are the method available to add middle-wares and extend the chat platform:

| Method                                       | Description                                                                                                                                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| node.chat.use(func)                          | The middleware will be execute for inbound and outbound messages, before any middleware registered with `.in()` and `.out()`                                                                                                                                  |
| node.chat.in(func)                           | The middleware will be execute for inbound, after all middlewares registered with `.use()`                                                                                                                                                                    |
| node.chat.out(func)                          | The middleware will be execute for all outbounds messages, after all middlewares registered with `.use()`                                                                                                                                                     |
| node.chat.out(myType, func)                  | The middleware will be execute for outbound messages of type _myType_, after all middlewares registered with `.use()` and `.out()` without a type                                                                                                             |
| node.chat.registerEvent(name[, label])       | Register the an event in order to be available in the drop-down of the `Rules node`                                                                                                                                                                           |
| node.chat.registerMessageType(type[, label]) | Register the a message type in order to be available in the drop-down of the `Rules node`                                                                                                                                                                     |
| node.chat.registerPlatform(name[, label])    | Register a messaging platform, use the `Support Table node` to show platforms/available message types                                                                                                                                                         |
| node.chat.onChatId(func)                     | Callback to extract the _chatId_ in a `Universal Connector node`. The passed function takes the incoming payload as a paramenter and should return a string (a unique identifier of the conversation)                                                         |
| node.chat.onTimestamp(func)                  | Callback to extract the _ts_ (timestamp) in a `Universal Connector node`. The passed function takes the incoming payload as a paramenter and should return a moment.js value (the date and time of the message), leave blank to get the current date and time |
| node.chat.onUserId(func)                     | Callback to extract the _userId_ in a `Universal Connector node`. The passed function takes the incoming payload as a paramenter and should return a string (a unique identifier of the user)                                                                 |
| node.chat.onMessageId(func)                  | Callback to extract the _messageId_ in a `Universal Connector node`. The passed function takes the incoming payload as a paramenter and should return a string (a unique identifier of the incoming message)                                                  |
| node.chat.onStart(func)                      | Callback when the node is initialized, must return a promise.                                                                                                                                                                                                 |
| node.chat.onStop(func)                       | Callback when **Node-RED** is shut down, must return a promise                                                                                                                                                                                                |

This node is available for all platforms.
