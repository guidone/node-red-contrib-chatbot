
Start a chat bot conversation, for example to initiate a conversation (sending a message) to a user in response of a **Node Red** event, chain this node to a `Message node` (or `Image node`, `Location node`, etc)

The `chatId` is needed to initiate the conversation (you can grab the _chatId_ from the logs or a debug node), the `chatId` is a unique identifier for a user in a specific platform (i.e. in _Telegram_ looks like _1234567746_, in _Slack_ _H0394KHM70C_, etc).

The parameters `chatId` and `transport` can be passed through the payload by the upstream node (if the transport and the bot configuration are already configured):

```javascript
msg.payload = {  
	chatId: '42'
};
return msg;
```

A conversation can be initiated also with the `userId`, which is a unique identifier for user in **RedBot** across different platforms. There’s a one-to-many relation between the `userId` and the `chatId` (the same user can have different _chatIds_ for for example for _Telegram_ and _Slack_). It’s possible to inspect these relations in **Mission Control**.

```javascript
msg.payload = {  
	userId: '43',  
	botNode: '34566789'
};
return msg;
```

The `botNode` is the Node-RED configuration node for the bot. The get the id go in the _Info_ panel in Node-RED, the pick the right node in the _Global Configuration Nodes_, the related id is on the panel below.

Available parameters for the `msg.payload`

| Name    | Type   | Description                                                                                                            |
| ------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| chatId  | string | The _chatId_ the message will be delivered to. The _chatId_ is the unique identifier for a user in a specific platform |
| userId  | string | The RedBot user the message will be delivered to                                                                       |
| botNode | string | The Node-RED node id of the bot configuration                                                                          |
