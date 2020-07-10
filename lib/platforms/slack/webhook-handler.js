const _ = require('underscore');
const moment = require('moment');

const parseActions = actions => {
  const result = {};
  actions.forEach(action => {
    switch(action.type) {
      case 'button':
        result[action.block_id] = action.value;
        break;
      case 'overflow':
      case 'static_select':
        result[action.block_id] = action.selected_option.value;
        break;
      case 'multi_static_select':
        result[action.block_id] = action.selected_options.map(option => option.value);
        break;
    }
  })
  return result;
}

const parseChannel = event => {
  // not sure if channel_ids is still used in slack event payloads
  if (_.isArray(event.channel_ids) && !_.isEmpty(event.channel_ids)) {
    return event.channel_ids[0]
  } else if (event.channel ) {
    return event.channel
  }
  else {
    return null
  }
}

const webhookHandler = function(req, res) {
  let payload;

  if (_.isObject(req.body) && !_.isEmpty(req.body.type)) {
    payload = req.body;
  } else {
    payload = this.parsePayload(req.body);
  }
  // if empty payload
  if (payload == null) {
    res.sendStatus(200);
  }

  if (payload.type === 'url_verification') {
    res.send({ challenge: req.body.challenge });
  } else if (payload != null && payload.type === 'interactive_message' && payload.actions[0].value.indexOf('dialog_') !== -1) {
    // if it's the callback of a dialog button, then relay a dialog message
    this.receive({
      type: 'dialog',
      channel: payload.channel.id,
      user: payload.user.id,
      text: payload.actions[0].value.replace('dialog_', ''),
      ts: moment.unix(payload.action_ts),
      trigger_id: payload.trigger_id,
      callback_id: payload.callback_id
    });
    // if there's feedback, send it back, otherwise do nothing
    if (!_.isEmpty(this.getButtonFeedback(payload.actions[0].name))) {
      res.send({
        response_type: 'ephemeral',
        replace_original: false,
        text: this.getButtonFeedback(payload.actions[0].name)
      });
    } else {
      res.send(''); // generic answer
    }
  } else if (payload != null && payload.type === 'interactive_message') {
    // relay a message with the value of the button
    this.receive({
      type: 'message',
      channel: payload.channel.id,
      user: payload.user.id,
      text: payload.actions[0].value,
      ts: moment.unix(payload.action_ts),
      trigger_id: payload.trigger_id,
      callback_id: payload.callback_id
    });
    // if there's feedback, send it back, otherwise do nothing
    if (!_.isEmpty(this.getButtonFeedback(payload.actions[0].name))) {
      res.send({
        response_type: 'ephemeral',
        replace_original: false,
        text: this.getButtonFeedback(payload.actions[0].name)
      });
    } else {
      res.send(''); // generic answer
    }
  } else if (payload.type === 'dialog_submission') {
    // intercept a dialog response and relay
    this.receive({
      type: 'response',
      channel: payload.channel.id,
      user: payload.user.id,
      response: payload.submission,
      ts: moment.unix(payload.action_ts),
      trigger_id: payload.trigger_id,
      callback_id: payload.callback_id
    });
    res.send(''); // 200 empty body
  } else if (payload.type === 'block_actions') {
    this.receive({
      type: 'response',
      channel: payload.channel.id,
      user: payload.user.id,
      response: parseActions(payload.actions),
      actions: payload.actions,
      ts: moment.unix(payload.action_ts),
      trigger_id: payload.trigger_id,
      callback_id: payload.callback_id
    });
    res.send(''); // generic answer
  } else if (payload.type === 'event_callback') {
    this.receive({
      type: 'event',
      channel: parseChannel(payload.event),
      eventPayload: _.omit(payload.event, 'type'),
      eventType: payload.event.type
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(200);
  }
};

module.exports = webhookHandler;