var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var RulesBlock = require('../nodes/chatbot-rules');

describe('Chat rules node', () => {

  it('should go through the first if language is the same', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isLanguage', language: 'en' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ language: 'en' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should go through the second if language is not the same', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isLanguage', language: 'en' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ language: 'it' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the topic is null', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isTopicEmpty' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should go with the second if the topic is not null', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isTopicEmpty' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'a_topic '});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the variable my_var is null', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'hasNotVariable', variable: 'my_var' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the variable my_var has a value', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'hasNotVariable', variable: 'my_var' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ my_var: 'something '});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the topic is different than my_topic', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isNotTopic', topic: 'my_topic' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'another_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the topic is my_topic', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isNotTopic', topic: 'my_topic' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'my_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the topic is equal to my_topic', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isTopic', topic: 'my_topic' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'my_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the topic is not my_topic', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isTopic', topic: 'my_topic' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'another_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });


  it('should match goes through the first if the namespace.my_topic contains namespace.', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'topicIncludes', topic: 'namespace.' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'namespace.my_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the namespace.my_topic doesn\'t contain another_namespace.', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'topicIncludes', topic: 'another_namespace.' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'namespace.my_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is inbound', () => {
    const msg = RED.createMessage({inbound: true});
    RED.node.config({
      rules: [
        { type: 'inbound' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is outbound', () => {
    const msg = RED.createMessage({inbound: false});
    RED.node.config({
      rules: [
        { type: 'outbound' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is outbound but with rules in payload', () => {
    const msg = RED.createMessage({
      inbound: false,
      rules: [
        { type: 'outbound' },
        { type: 'catchAll' }
      ]
    });
    RED.node.config({});
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the variable my_var is not null', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'hasVariable', variable: 'my_var' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ my_var: 'something '});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the variable my_var has not a value', () => {
    const msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'hasVariable', variable: 'my_var' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    msg.chat().set({});
    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is the command /my_command', () => {
    const msg = RED.createMessage({
      content: '/my_command'
    });
    RED.node.config({
      rules: [
        { type: 'command', command: '/my_command' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is the command /my_command with parameter', () => {
    const msg = RED.createMessage({
      content: '/my_command 12345'
    });
    RED.node.config({
      rules: [
        { type: 'command', command: '/my_command' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the message is not the command /my_command', () => {
    const msg = RED.createMessage({
      content: 'a simple message'
    });
    RED.node.config({
      rules: [
        { type: 'command', command: '/my_command' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is any command', () => {
    const msg = RED.createMessage({
      content: '/my_command'
    });
    RED.node.config({
      rules: [
        { type: 'anyCommand' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should go through the second if the message is not the a command', () => {
    const msg = RED.createMessage({
      content: 'a simple message'
    });
    RED.node.config({
      rules: [
        { type: 'anyCommand' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should go through the first if is production env', () => {
    const msg = RED.createMessage({
      content: 'a simple message'
    }, 'telegram', { environment: 'production'});
    RED.node.config({
      rules: [
        { type: 'environment', environment: 'production' },
        { type: 'environment', environment: 'development' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should go through the first if is development env', () => {
    const msg = RED.createMessage({
      content: 'a simple message'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'environment', environment: 'production' },
        { type: 'environment', environment: 'development' },
        { type: 'catchAll' }
      ]
    });

    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should go through the first if is type message', () => {
    const msg = RED.createMessage({
      content: 'a simple message'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'messageType', environment: 'message' },
        { type: 'messageType', environment: 'video' },
        { type: 'catchAll' }
      ]
    });

    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(2));
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should go through the first if is type message', () => {
    const msg = RED.createMessage({
      content: 'a simple message',
      type: 'message'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'messageType', messageType: 'message' },
        { type: 'messageType', messageType: 'video' },
        { type: 'catchAll' }
      ]
    });

    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(2));
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should go through the second if is type video', () => {
    const msg = RED.createMessage({
      content: 'a simple message',
      type: 'video'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'messageType', messageType: 'message' },
        { type: 'messageType', messageType: 'video' },
        { type: 'catchAll' }
      ]
    });

    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(2));
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should go through the third if is type image', () => {
    const msg = RED.createMessage({
      content: 'a simple message',
      type: 'image'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'messageType', messageType: 'message' },
        { type: 'messageType', messageType: 'video' },
        { type: 'catchAll' }
      ]
    });

    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(2).originalMessage.chat.id, '42');
      });
  });

  it('should go through the second if is type command', () => {
    const msg = RED.createMessage({
      content: '/my_command',
      type: 'image'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'messageType', messageType: 'message' },
        { type: 'messageType', messageType: 'command' },
        { type: 'catchAll' }
      ]
    });

    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.isNull(RED.node.message(2));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should go through the first if is type is not command', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'image'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'notMessageType', messageType: 'command' },
        { type: 'catchAll' }
      ]
    });

    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should go through the first if the transport is Telegram', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'image'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'transport', transport: 'telegram' },
        { type: 'catchAll' }
      ]
    });

    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should go through the second if the transport is Facebook', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'image'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'transport', transport: 'facebook' },
        { type: 'catchAll' }
      ]
    });

    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(0));
      });
  });

  it('should go through the first if the variable is eq to test_value', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'image'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'isVariable', variable: 'myVar', value: 'test_value' },
        { type: 'catchAll' }
      ]
    });
    msg.chat().set('myVar', 'test_value');
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should go through the second if the variable is neq to test_value', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'image'
    }, 'telegram', { environment: 'development'});
    RED.node.config({
      rules: [
        { type: 'isVariable', variable: 'myVar', value: 'test_value' },
        { type: 'catchAll' }
      ]
    });
    msg.chat().set('myVar', 'wrong_test_value');
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(0));
      });
  });

  it('should go through the first if the message is event', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'event',
      eventType: 'new-user'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'messageEvent', event: 'new-user'},
        { type: 'catchAll' }
      ]
    });
    msg.chat().set('myVar', 'test_value');
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should go through the second if the message is a different event', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'event',
      eventType: 'referral'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'messageEvent', event: 'new-user'},
        { type: 'catchAll' }
      ]
    });
    msg.chat().set('myVar', 'test_value');
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(0));
      });
  });

  it('should go through the first is pending', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'event',
      eventType: 'referral'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'pending'},
        { type: 'catchAll' }
      ]
    });
    msg.chat().set('pending', true);
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should go through the second is pending', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'event',
      eventType: 'referral'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'pending'},
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(0));
      });
  });

  it('should go through the first is not pending', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'event',
      eventType: 'referral'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'notPending'},
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should go through the second is not pending', () => {
    const msg = RED.createMessage({
      content: 'no command',
      type: 'event',
      eventType: 'referral'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'notPending'},
        { type: 'catchAll' }
      ]
    });
    msg.chat().set('pending', true);
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(0));
      });
  });

  it('should go through the first if intent', () => {
    const msg = RED.createMessage({
      type: 'intent',
      intent: 'my_intent'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'isIntent' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should go through the second if intent my_intent', () => {
    const msg = RED.createMessage({
      type: 'intent',
      intent: 'my_intent'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'isIntentName', intent: 'not_my_intent' },
        { type: 'isIntentName', intent: 'my_intent' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(2));
      });
  });

  it('should go through the first if intent my_intent is confirmed', () => {
    const msg = RED.createMessage({
      type: 'intent',
      intent: 'my_intent',
      confirmationStatus: 'confirmed'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'isIntentConfirmationStatus', confirmationStatus: 'confirmed' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should go through the first if slot room if my_intent is confirmed', () => {
    const msg = RED.createMessage({
      type: 'intent',
      intent: 'my_intent',
      confirmationStatus: 'confirmed',
      variables : {
        room: 'kitchen'
      },
      slotConfirmationStatus: {
        room: 'confirmed'
      }
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'isSlotConfirmationStatus', slot: 'room', confirmationStatus: 'confirmed' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should go through the first if dialog is pending', () => {
    const msg = RED.createMessage({
      type: 'intent',
      intent: 'my_intent',
      dialogState: 'pending'
    }, 'telegram');
    RED.node.config({
      rules: [
        { type: 'dialogState', state: 'pending' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
        assert.isNull(RED.node.message(1));
      });
  });

});

