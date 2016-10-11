var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ApiAi = require('./lib/apiai-stub');
var ApiAiBlock = require('../chatbot-apiai');

var ApiAiMessage1 = {
  "id": "9d4d6dc6-0c27-433b-9862-a26997d133a5",
  "timestamp": "2016-10-11T19:48:46.994Z",
  "result": {
    "source": "agent",
    "resolvedQuery": "switch on lights",
    "action": "switch_on",
    "actionIncomplete": true,
    "parameters": {
      "Furniture": "lights",
      "OnOff": "on",
      "Rooms": ""
    },
    "contexts": [
      {
        "name": "accendi",
        "parameters": {
          "Furniture.original": "lights",
          "Rooms.original": "",
          "Furniture": "lights",
          "OnOff": "on",
          "OnOff.original": "on",
          "Rooms": ""
        },
        "lifespan": 4
      },
      {
        "name": "lamps_dialog_context",
        "parameters": {
          "Furniture.original": "lights",
          "Rooms.original": "",
          "Furniture": "lights",
          "OnOff": "on",
          "OnOff.original": "on",
          "Rooms": ""
        },
        "lifespan": 2
      },
      {
        "name": "08af509a-8db6-43e8-a63e-9aabe011d648_id_dialog_context",
        "parameters": {
          "Furniture.original": "lights",
          "Rooms.original": "",
          "Furniture": "lights",
          "OnOff": "on",
          "OnOff.original": "on",
          "Rooms": ""
        },
        "lifespan": 2
      },
      {
        "name": "lamps_dialog_params_rooms",
        "parameters": {
          "Furniture.original": "lights",
          "Rooms.original": "",
          "Furniture": "lights",
          "OnOff": "on",
          "OnOff.original": "on",
          "Rooms": ""
        },
        "lifespan": 1
      }],
    "metadata": {
      "intentId": "08af509a-8db6-43e8-a63e-9aabe011d648",
      "webhookUsed": "false",
      "intentName": "Lamps"
    },
    "fulfillment": {"speech": "In which room?"},
    "score": 1
  }, "status": {"code": 200, "errorType": "success"}, "sessionId": "196520947"
};

var ApiAiMessage2 = {
  "id": "955cf87b-caa8-4691-9073-79fc21041ed0",
  "timestamp": "2016-10-11T20:06:23.057Z",
  "result": {
    "source": "agent",
    "resolvedQuery": "living room",
    "action": "switch_on",
    "actionIncomplete": false,
    "parameters": {"Furniture": "lights", "OnOff": "on", "Rooms": "living room"},
    "contexts": [{
      "name": "accendi",
      "parameters": {
        "Furniture.original": "lights",
        "Rooms.original": "living room",
        "Furniture": "lights",
        "OnOff": "on",
        "OnOff.original": "on",
        "Rooms": "living room"
      },
      "lifespan": 4
    }, {
      "name": "lights",
      "parameters": {
        "Furniture.original": "lights",
        "Rooms.original": "living room",
        "Furniture": "lights",
        "OnOff": "on",
        "OnOff.original": "on",
        "Rooms": "living room"
      },
      "lifespan": 5
    }],
    "metadata": {"intentId": "08af509a-8db6-43e8-a63e-9aabe011d648", "webhookUsed": "false", "intentName": "Lamps"},
    "fulfillment": {"speech": "Yes, I am switching the lights"},
    "score": 1
  },
  "status": {"code": 200, "errorType": "success"},
  "sessionId": "196520947"
};


describe('Chat Api.ai node', function() {

  it('should pass through 1 need refinement', function() {
    var msg = RED.createMessage({
      content: 'switch on the lights in the living room'
    });
    var nodeId = '123456';
    RED.node.config({
      apiai: nodeId,
      rules: [
        {topic: 'ask_email'},
        {topic: 'ask_name'},
        {topic: ''},
        {topic: 'ask_name'}
      ]
    });
    RED.nodes.setNode(nodeId, ApiAi(ApiAiMessage1));

    ApiAiBlock(RED);
    RED.environment.chat(msg.originalMessage.chat.id, {
      chatId: msg.originalMessage.chat.id,
      topic: 'ask_name'
    });
    RED.node.get().emit('input', msg);

    assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
    assert.equal(RED.node.message(0).payload, 'In which room?');
    assert.isUndefined(RED.node.message(1));
    assert.isUndefined(RED.node.message(2));

  });

  it('should pass through 3 refinement is done', function() {
    var msg = RED.createMessage({
      content: 'switch on the lights'
    });
    var nodeId = '123456';
    RED.node.config({
      apiai: nodeId,
      rules: [
        {topic: 'useless'},
        {topic: 'lights,useless2'}
      ]
    });
    RED.nodes.setNode(nodeId, ApiAi(ApiAiMessage2));

    ApiAiBlock(RED);
    RED.environment.chat(msg.originalMessage.chat.id, {
      chatId: msg.originalMessage.chat.id,
      topic: 'ask_name'
    });
    RED.node.get().emit('input', msg);


    assert.isNull(RED.node.message(0));
    assert.isNull(RED.node.message(1));
    assert.equal(RED.node.message(2).originalMessage.chat.id, '42');
    assert.equal(RED.node.message(2).payload, 'Yes, I am switching the lights');

  });

});

