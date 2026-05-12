
Create MP3 from plain text. Can be connected directly to a sender node (there’s no need of [Audio node](https://www.notion.so/fab15f139525400f8719ff182238eb4c) ).

The text message can be passed through the payload by the upstream node:

```javascript
msg.payload = 'I am a message to be converted in audio file';
return msg;
```
