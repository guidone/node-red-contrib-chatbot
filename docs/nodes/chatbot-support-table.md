
This is a debug node, it dumps in the console a platform compatibility chart for message types.

![](./docs/assets/eed0c3c861c1c218.png)

[Extend node](https://app.notion.com/p/04668c7a415547bc9f34be57dd063db2)  can also declares additional platforms and message types with

```javascript
node.chat.registerPlatform('dialog', 'Dialog');
node.chat.registerMessageType('message');
node.chat.registerMessageType('photo');
node.chat.registerMessageType('inline-buttons');
```

These lines of codes have also the effect to update the transport and message type dropdowns in the [Rules node](https://app.notion.com/p/4113636f565d4ff4af08bc61a644206b) 
