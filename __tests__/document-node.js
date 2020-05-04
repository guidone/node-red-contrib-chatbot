const fs = require('fs');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const DocumentBlock = require('../nodes/chatbot-document');

require('../lib/platforms/telegram');
require('../lib/platforms/facebook/facebook');
describe('Chat document node', () => {

  it('should send a local pdf document with filename parameter using context variables', () => {
    const msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      name: 'my file',
      document: '{{myfile}}',
      caption: '{{mycaption}} for {{myfile}}'
    });
    msg.chat().set({
      myfile: __dirname + '/dummy/file.pdf',
      mycaption: 'I am a caption'
    });
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'document');
        assert.equal(RED.node.message().payload.mimeType, 'application/pdf');
        assert.include(RED.node.message().payload.caption, 'I am a caption for');
        assert.include(RED.node.message().payload.caption, '__tests__/dummy/file.pdf');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.pdf');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a local pdf document with filename parameter Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      name: 'my file',
      document: __dirname + '/dummy/file.pdf'
    });
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'document');
        assert.equal(RED.node.message().payload.mimeType, 'application/pdf');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.pdf');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a local pdf document with filename parameter in upstream node Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    msg.filename = __dirname + '/dummy/file.pdf';
    RED.node.config({});
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'document');
        assert.equal(RED.node.message().payload.mimeType, 'application/pdf');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.pdf');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a document from bin a file with Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      name: 'my file',
      document: __dirname + '/dummy/file.bin'
    });
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'document');
        assert.equal(RED.node.message().payload.mimeType, 'application/zip');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.zip');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a document from image a file with Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      name: 'my file',
      document: __dirname + '/dummy/image.png'
    });
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'document');
        assert.equal(RED.node.message().payload.mimeType, 'application/zip');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'image.zip');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a buffer document with Telegram using name for mime type', () => {
    const msg = RED.createMessage(fs.readFileSync(__dirname + '/dummy/image.png'), 'telegram');
    RED.node.config({
      name: 'my-file.zip'
    });
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'document');
        assert.equal(RED.node.message().payload.mimeType, 'application/zip');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'my-file.zip');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a buffer document with Telegram from a RedBot file node', () => {
    const msg = RED.createMessage({
      document: fs.readFileSync(__dirname + '/dummy/image.png')
    }, 'telegram');
    msg.filename = '/dummy/image.png';
    RED.node.config({});
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'document');
        assert.equal(RED.node.message().payload.mimeType, 'application/zip');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'image.zip');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a buffer document with Telegram without using name for mime type', () => {
    const msg = RED.createMessage(fs.readFileSync(__dirname + '/dummy/image.png'), 'telegram');
    RED.node.config({});
    DocumentBlock(RED);

    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(
        () => {},
        () => {
        assert.equal(RED.node.error(), 'Unknown file type, use the "name" parameter to specify the file name and extension as default');
        }
      );
  });

  it('should send a document from pdf a file with Facebook', () => {
    const msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      name: 'my file',
      document: __dirname + '/dummy/file.pdf'
    });
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'document');
        assert.equal(RED.node.message().payload.mimeType, 'application/pdf');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.pdf');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a document from image a file with Facebook', () => {
    const msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      name: 'my file',
      document: __dirname + '/dummy/image.png'
    });
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'document');
        assert.equal(RED.node.message().payload.mimeType, 'image/png');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'image.png');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a local pdf document with a wrong filename parameter in upstream node Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    msg.filename = __dirname + '/dummy/file-wrong.pdf';
    RED.node.config({});
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(
        () => {},
        () => {
          assert.include(RED.node.error(), 'Error opening file');
          assert.include(RED.node.error(), 'file-wrong.pdf');
        }
      );
  });

  it('should send document appending upstream text message', async () => {
    const msg = RED.createRawMessage({
      message: 'message for the buttons',
      payload: {
        type: 'message',
        content: 'I am the previous message',
        chatId: 42,
        inbound: false
      }
    }, 'telegram');
    RED.node.config({
      name: 'my file',
      document: __dirname + '/dummy/image.png'
    });
    DocumentBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await();
    const response = RED.node.message().payload;

    assert.equal(response[0].type, 'message');
    assert.equal(response[0].chatId, 42);
    assert.equal(response[0].inbound, false);
    assert.equal(response[0].content, 'I am the previous message');
    assert.equal(response[1].type, 'document');
    assert.equal(response[1].mimeType, 'application/zip');
    assert.equal(response[1].inbound, false);
    assert.instanceOf(response[1].content, Buffer);
    assert.equal(response[1].filename, 'image.zip');
  });

});
