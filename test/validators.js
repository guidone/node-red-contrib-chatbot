var _ = require('underscore');
var assert = require('chai').assert;
var validators = require('../lib/helpers/validators');

describe('Validators', function() {

  it('validate a button', function() {
    assert.isFalse(validators.button({}));
    assert.isFalse(validators.button({type: null}));
    assert.isFalse(validators.button());
    assert.isTrue(validators.button({type: 'url'}));
    assert.isTrue(validators.button({type: 'share'}));
    assert.isTrue(validators.button({type: 'postback'}));
  });

  it('validate buttons', function() {
    assert.isFalse(validators.buttons([]));
    assert.isFalse(validators.buttons([{}]));
    assert.isTrue(validators.buttons([{type: 'url'}]));
    assert.isTrue(validators.buttons([{type: 'postback'}, {type: 'url'}]));
    assert.isFalse(validators.buttons([{type: 'postback'}, {type: 'url'}, {}]));
  });

  it('validate a generic template', function() {
    assert.isFalse(validators.genericTemplateElement({}));
    assert.isFalse(validators.genericTemplateElement({title: 'title'}));
    assert.isTrue(validators.genericTemplateElement({
      title: 'title',
      buttons: [{type: 'postback'}, {type: 'url'}]
    }));
    assert.isTrue(validators.genericTemplateElement({
      title: 'title',
      subtitle: 'subtittle',
      buttons: [{type: 'postback'}, {type: 'url'}, {type: 'share'}]
    }));
    assert.isFalse(validators.genericTemplateElement({
      title: 'title',
      subtitle: 'subtittle',
      buttons: [{type: 'postback'}, {type: 'url'}, {}]
    }));
  });

  it('validate a generic template array', function() {
    assert.isFalse(validators.genericTemplateElements([]));
    assert.isFalse(validators.genericTemplateElements([{}]));
    assert.isFalse(validators.genericTemplateElements([
      {title: 'title'}
    ]));
    assert.isTrue(validators.genericTemplateElements([
      {title: 'title', buttons: [{type: 'postback'}, {type: 'url'}]}
    ]));
    assert.isTrue(validators.genericTemplateElements([
      {title: 'title', buttons: [{type: 'postback'}, {type: 'url'}]},
      {title: 'title2', subtitle: 'subtitle2', buttons: [{type: 'postback'}, {type: 'share'}]}
    ]));
    assert.isFalse(validators.genericTemplateElements([
      {title: 'title', buttons: [{type: 'postback'}, {type: 'url'}]},
      {title: 'title2', subtitle: 'subtitle2', buttons: [{type: 'postback'}, {type: 'share'}, {}]}
    ]));
  });

});

