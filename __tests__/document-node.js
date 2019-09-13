const fs = require('fs');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const DocumentBlock = require('../nodes/chatbot-document');

require('../lib/platforms/telegram');
require('../lib/platforms/facebook/facebook');
describe('Chat document node', () => {

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

});
