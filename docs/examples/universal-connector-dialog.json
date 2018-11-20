[
  {
    "id": "5635b840.63d498",
    "type": "tab",
    "label": "Flow 1",
    "disabled": false,
    "info": ""
  },
  {
    "id": "68cb6e53.5d9f9",
    "type": "chatbot-universal-receive",
    "z": "5635b840.63d498",
    "bot": "dc8f07b.959c7f8",
    "botProduction": "",
    "x": 110,
    "y": 240,
    "wires": [
      [
        "a1ce8e83.b4f5b",
        "4554cf7c.cd7cb"
      ]
    ]
  },
  {
    "id": "7536db8d.84ebf4",
    "type": "chatbot-extend",
    "z": "5635b840.63d498",
    "codeJs": "const DialogBotSDK = node.context().global.get('DialogBot');\n\nnode.chat.onChatId(message => message.sender.peer.id);\n\nnode.chat.registerPlatform('dialog', 'Dialog');\nnode.chat.registerMessageType('message');\nnode.chat.registerMessageType('photo');\nnode.chat.registerMessageType('inline-buttons');\n\n/*node.chat.onStop(function() {\n   var options = this.getOptions();\n   options.connector = null;\n   return true;\n});*/\n\nnode.chat.onStart(function() {\n  var chatServer = this;\n  var options = this.getOptions();\n  options.connector = new DialogBotSDK.Bot(options.token);\n  options.connector.onMessage(function(peer, message) {\n    console.log(message);  \n    chatServer.receive(message);\n  });\n  options.connector.onInteractiveEvent(function(event) {\n    chatServer.receive({\n      mid: event.mid,\n      sender: { \n        peer: { type: 'user', id: event.uid },\n      },\n      isOut: false,\n      content: { \n        type: 'text', \n        text: event.value\n      }\n    });\n  });\n  \n  return true;    \n});\n\nnode.chat.in(function(message) {\n  const chat = message.chat();\n  if (message.originalMessage.content.type === 'text') {\n    message.payload.type = 'message';\n    message.payload.content = message.originalMessage.content.text;\n    return Promise.resolve(chat.set('message', message.originalMessage.content.text))\n      .then(() => message);\n  }\n  return message;  \n});\n\nnode.chat.in(function(message) {\n  const request = this.request;\n  if (message.originalMessage.content.type === 'photo') {\n    return request({ url: message.originalMessage.content.fileUrl})\n      .then(image => {\n        message.payload.type = 'photo';\n        message.payload.content = image;  \n        return message;\n      });\n  } \n  return message;    \n});\n\n// ensure the chatId is always a number, those inserted with the conversation\n// node are string\nnode.chat.out(function(message) {\n  if (message.payload.chatId != null && typeof message.payload.chatId === 'string') {\n    message.payload.chatId = parseInt(message.payload.chatId, 10);\n  } \n  return message;    \n});\n\nnode.chat.out('message', function(message) {\n  const bot = this.getConnector();\n  const chat = message.chat();\n  const peer = { type: 'user', id: message.payload.chatId };\n  return new Promise(function(resolve, reject) {\n    bot.sendTextMessage(peer, message.payload.content)\n      .then(mid => chat.set('messageId', mid))\n      .then(\n        () => resolve(message),\n        reject\n      );      \n  });\n});\n\nnode.chat.out('inline-buttons', function(message) {\n  const bot = this.getConnector();\n  const chat = message.chat();\n  const peer = { type: 'user', id: message.payload.chatId };\n  \n  const buttons = [{\n    actions: message.payload.buttons\n      .filter(button => button.type === 'postback')\n      .map(button => ({\n        id: button.value,\n        widget: {\n          type: 'button',\n          value: button.value,\n          label: button.label\n        }\n      }))\n  }];\n  return new Promise(function(resolve, reject) {\n    bot.sendInteractiveMessage(peer, message.payload.content, buttons)\n      .then(mid => chat.set('messageId', mid))\n      .then(\n        () => resolve(message),\n        reject\n      );  \n  });\n});",
    "platform": "universal",
    "noerr": 0,
    "x": 130,
    "y": 320,
    "wires": []
  },
  {
    "id": "a1ce8e83.b4f5b",
    "type": "chatbot-debug",
    "z": "5635b840.63d498",
    "x": 423,
    "y": 324,
    "wires": []
  },
  {
    "id": "89ea8b97.d165f8",
    "type": "chatbot-message",
    "z": "5635b840.63d498",
    "name": "",
    "message": [
      {
        "message": "comando {{message}}"
      }
    ],
    "answer": false,
    "x": 450,
    "y": 200,
    "wires": [
      [
        "eace7497.df1478"
      ]
    ]
  },
  {
    "id": "eace7497.df1478",
    "type": "chatbot-universal-send",
    "z": "5635b840.63d498",
    "bot": "dc8f07b.959c7f8",
    "botProduction": "",
    "track": false,
    "passThrough": false,
    "outputs": 0,
    "x": 690,
    "y": 200,
    "wires": []
  },
  {
    "id": "8c762069.f532f",
    "type": "chatbot-inline-buttons",
    "z": "5635b840.63d498",
    "name": "",
    "buttons": [
      {
        "type": "postback",
        "label": "Test",
        "value": "/test",
        "answer": "",
        "alert": false,
        "style": ""
      },
      {
        "type": "postback",
        "label": "Another test",
        "value": "/another",
        "answer": "",
        "alert": false,
        "style": ""
      }
    ],
    "message": "Message with the buttons",
    "x": 460,
    "y": 240,
    "wires": [
      [
        "eace7497.df1478"
      ]
    ]
  },
  {
    "id": "1daa2585.fced2a",
    "type": "chatbot-support-table",
    "z": "5635b840.63d498",
    "x": 420,
    "y": 440,
    "wires": []
  },
  {
    "id": "d6ba61fd.5a3d",
    "type": "inject",
    "z": "5635b840.63d498",
    "name": "",
    "topic": "",
    "payload": "",
    "payloadType": "date",
    "repeat": "",
    "crontab": "",
    "once": false,
    "onceDelay": 0.1,
    "x": 180,
    "y": 440,
    "wires": [
      [
        "1daa2585.fced2a"
      ]
    ]
  },
  {
    "id": "4554cf7c.cd7cb",
    "type": "chatbot-rules",
    "z": "5635b840.63d498",
    "name": "",
    "rules": [
      {
        "type": "anyCommand"
      },
      {
        "type": "catchAll"
      }
    ],
    "outputs": 2,
    "x": 290,
    "y": 200,
    "wires": [
      [
        "89ea8b97.d165f8"
      ],
      [
        "8c762069.f532f"
      ]
    ]
  },
  {
    "id": "5e4e23b3.ec92dc",
    "type": "chatbot-conversation",
    "z": "5635b840.63d498",
    "name": "Dialog",
    "botTelegram": "",
    "botSlack": "",
    "botFacebook": "",
    "botViber": "",
    "botUniversal": "dc8f07b.959c7f8",
    "botTwilio": "",
    "chatId": "246093853",
    "transport": "universal",
    "messageId": "",
    "contextMessageId": false,
    "store": "",
    "x": 290,
    "y": 560,
    "wires": [
      [
        "c1280d64.a36b5"
      ]
    ]
  },
  {
    "id": "e8242ca7.cc3cb",
    "type": "inject",
    "z": "5635b840.63d498",
    "name": "",
    "topic": "",
    "payload": "",
    "payloadType": "date",
    "repeat": "",
    "crontab": "",
    "once": false,
    "onceDelay": 0.1,
    "x": 120,
    "y": 560,
    "wires": [
      [
        "5e4e23b3.ec92dc"
      ]
    ]
  },
  {
    "id": "c1280d64.a36b5",
    "type": "chatbot-message",
    "z": "5635b840.63d498",
    "name": "",
    "message": [
      {
        "message": "conversation 222"
      }
    ],
    "answer": false,
    "x": 470,
    "y": 560,
    "wires": [
      [
        "19e82afc.4705c5",
        "377465db.ddd1ea"
      ]
    ]
  },
  {
    "id": "19e82afc.4705c5",
    "type": "chatbot-universal-send",
    "z": "5635b840.63d498",
    "bot": "dc8f07b.959c7f8",
    "botProduction": "",
    "track": false,
    "passThrough": false,
    "outputs": 0,
    "x": 670,
    "y": 560,
    "wires": []
  },
  {
    "id": "377465db.ddd1ea",
    "type": "debug",
    "z": "5635b840.63d498",
    "name": "",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "true",
    "x": 630,
    "y": 620,
    "wires": []
  },
  {
    "id": "a69c8b27.0e2db8",
    "type": "chatbot-universal-receive",
    "z": "5635b840.63d498",
    "bot": "dc8f07b.959c7f8",
    "botProduction": "",
    "x": 570,
    "y": 1140,
    "wires": [
      []
    ]
  },
  {
    "id": "f0a86a6f.9e4f48",
    "type": "http in",
    "z": "5635b840.63d498",
    "name": "",
    "url": "/redbot/twilio",
    "method": "post",
    "upload": false,
    "swaggerDoc": "",
    "x": 330,
    "y": 1140,
    "wires": [
      [
        "a69c8b27.0e2db8"
      ]
    ]
  },
  {
    "id": "dc8f07b.959c7f8",
    "type": "chatbot-universal-node",
    "z": "",
    "botname": "DialogBot",
    "usernames": "",
    "connectorParams": "",
    "store": "2f85250d.acd45a",
    "log": "",
    "debug": false
  },
  {
    "id": "2f85250d.acd45a",
    "type": "chatbot-context-store",
    "z": "",
    "name": "Memory",
    "contextStorage": "memory",
    "contextParams": ""
  }
]
