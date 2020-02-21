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
    assert.isTrue(validators.buttons([
      {type: 'postback'},
      {label: 'subitems', items: [{type: 'postback'}, {type: 'url'}]}
      ]));
    assert.isFalse(validators.buttons([{type: 'postback'}, {type: 'url'}, {}]));
    assert.isFalse(validators.buttons([{type: 'wrong-type'}, {type: 'url'}, {}]));
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

  it('validates a file path', function() {
    assert.isFalse(validators.filepath('not a real path'));
    assert.isTrue(validators.filepath('/dir/file.mp3'));
    assert.isTrue(validators.filepath('/dir/test'));
    assert.isTrue(validators.filepath('./dir/test'));
    assert.isTrue(validators.filepath('../dir/test'));
  });

  it('validates a url', function() {
    assert.isFalse(validators.url('http://barabba'));
    assert.isFalse(validators.url('not a real url'));
    assert.isFalse(validators.url('http://'));
    assert.isFalse(validators.url('http://notld'));
    assert.isTrue(validators.url('http://domain.it'));
    assert.isTrue(validators.url('http://host.com//dir/file.mp3'));
    assert.isTrue(validators.url('https://hots.com/dir/file.mp3'));
    assert.isTrue(validators.url(' https://username:password@www.mydomain.it/cgi-bin'));
    assert.isTrue(validators.url(' https://username:password@www.mydomain.it:8184/cgi-bin/CGIProxy.fcgi?cmd=snapPicture2&usr=xxxxx&pwd=xxxxxxxx'));
    assert.isTrue(validators.url(' https://username:password@192.168.1.23:8184/cgi-bin/CGIProxy.fcgi?cmd=snapPicture2&usr=xxxxx&pwd=xxxxxxxx'));
  });

  it('validates a buffer', function() {
    assert.isFalse(validators.buffer('not a real buffer'));
    assert.isTrue(validators.buffer(new Buffer('just a buffer')));
  });

  it('validates a string', function() {
    assert.isFalse(validators.string(42));
    assert.isFalse(validators.string(''));
    assert.isFalse(validators.string({}));
    assert.isTrue(validators.string('test string'));
  });

  it('validates a boolean', function() {
    assert.isFalse(validators.boolean(42));
    assert.isFalse(validators.boolean(''));
    assert.isFalse(validators.boolean('true'));
    assert.isTrue(validators.boolean(true));
    assert.isTrue(validators.boolean(false));
  });

  it('validates an array', function() {
    assert.isFalse(validators.array(42));
    assert.isFalse(validators.array('[]'));
    assert.isFalse(validators.array([]));
    assert.isTrue(validators.array([1]));
    assert.isTrue(validators.array([1, 2]));
  });

  it('validates NLP token', function() {
    assert.isTrue(validators.nlpToken('is[verb]'));
    assert.isTrue(validators.nlpToken('[noun]->my_var'));
    assert.isTrue(validators.nlpToken('is[verb]->verb'));
    assert.isFalse(validators.nlpToken('is[verb'));
    assert.isFalse(validators.nlpToken('[verb]-'));
    assert.isFalse(validators.nlpToken('[verb]->['));
    assert.isFalse(validators.nlpToken('[verb]->'));
    assert.isFalse(validators.nlpToken('[]->var'));
  });

  it('validates NLP tokens', function() {
    assert.isTrue(validators.nlpTokens('is[verb],[noun]->my_var'));
    assert.isTrue(validators.nlpTokens('[noun]->my_var'));
    assert.isFalse(validators.nlpTokens('[noun->my_var'));
    assert.isFalse(validators.nlpTokens('is[verb],[noun->my_var'));
  });

  it('validates an integer', function() {
    assert.isTrue(validators.integer('42'));
    assert.isTrue(validators.integer('12'));
    assert.isFalse(validators.integer(''));
    assert.isFalse(validators.integer('fortytwo'));
    assert.isFalse(validators.integer('{{variable}}'));
  });

  it('validates a float', function() {
    assert.isTrue(validators.float('42.22'));
    assert.isTrue(validators.float('0042.2123123'));
    assert.isTrue(validators.float('12'));
    assert.isFalse(validators.float(''));
    assert.isFalse(validators.float('fortytwo'));
  });

  it('validates a variable', function() {
    assert.isTrue(validators.isVariable('{{price}}'));
    assert.isFalse(validators.isVariable('{{price{{'));
  });

  it('validates a Telegram price', function() {
    assert.isTrue(validators.invoiceItem({ label: 'Test', amount: '1.23' }));
    assert.isFalse(validators.invoiceItem({ label: 'Test', amount: '{{price{{' }));
  });

  it('validates a Telegram prices', function() {
    assert.isTrue(validators.invoiceItems([{ label: 'Test', amount: '1.23' }]));
    assert.isTrue(validators.invoiceItems([{ label: 'Test', amount: '1.23' }, { label: 'Test 2', amount: 1.23 }]));
    assert.isTrue(validators.invoiceItems([{ label: 'Test', amount: '{{price}}' }, { label: 'Test 2', amount: 1.23 }]));
    assert.isFalse(validators.invoiceItems([{ label: 'Test', amount: null }]));
    assert.isFalse(validators.invoiceItems([{ label: 'Test', amount: '{{price{{' }, { label: 'Test 2', amount: 1.23 }]));
    assert.isFalse(validators.invoiceItems([{ label: null, amount: '1.23' }]));
  });

  it('Validates a URL', function() {
    assert.isTrue(validators.url('http://www.google.com'));
    assert.isFalse(validators.secureUrl('http://www.google.com'));
    assert.isTrue(validators.secureUrl('https://www.google.com'));
    assert.isTrue(validators.url('http://www.google.com/barabba'));
    assert.isFalse(validators.url('www.google.com/barabba'));
    assert.isFalse(validators.url('http://google/barabba'));
  });

  it('validates a Telegram configuration', function() {
    var base = {
      authorizedUsernames: '12213123',
      token: 'xxx:xxxxyyyyyyzzzz',
      polling: 1000,      
      contextProvider: 'memory',
      logfile: null,
      connectMode: 'polling'
    };

    assert.isNull(validators.platform.telegram(base));
    assert.isNull(validators.platform.telegram(_.extend({}, base, { connectMode: null })));
    assert.isNotNull(validators.platform.telegram(_.extend({}, base, { polling: 'aaaa'})));
    assert.isNotNull(validators.platform.telegram(_.extend({}, base, { connectMode: 'webHook' })));
    assert.isNull(validators.platform.telegram(_.extend({}, base, {
      connectMode: 'webHook',
      webHook: 'https://1234.endpoint.it/blabla'
    })));
    assert.isNotNull(validators.platform.telegram(_.extend({}, base, {
      connectMode: 'webHook',
      webHook: 'http://1234.endpoint.it/blabla'
    })));
    assert.isNotNull(validators.platform.telegram(_.extend({}, base, { token: null})));
    assert.isNotNull(validators.platform.telegram(_.extend({}, base, { token: ''})));
    assert.isNotNull(validators.platform.telegram(_.extend({}, base, { contextProvider: 'wrong_context'})));
    assert.isNotNull(validators.platform.telegram(_.extend({}, base, { authorizedUsernames: 42})));
    assert.isNotNull(validators.platform.telegram(_.extend({}, base, { logfile: 42})));
  });

  it('validates a Slack configuration', function() {
    var base = {
      botname: 'guidone_bot',
      token: 'xoxb-00000000-1111111111111',
      authorizedUsernames: null,
      contextProvider: 'memory',
      logfile: null,
      oauthToken: '12345678901234567890'
    };

    assert.isNull(validators.platform.slack(base));
    assert.isNotNull(validators.platform.slack(_.extend(base, { botname: null})));
    assert.isNotNull(validators.platform.slack(_.extend(base, { token: null})));
    assert.isNotNull(validators.platform.slack(_.extend(base, { token: ''})));
    assert.isNotNull(validators.platform.slack(_.extend(base, { contextProvider: 'wrong_context'})));
    assert.isNotNull(validators.platform.slack(_.extend(base, { authorizedUsernames: 42})));
    assert.isNotNull(validators.platform.slack(_.extend(base, { logfile: 42})));
  });

  it('validates a Facebook configuration', function() {
    var base = {
      authorizedUsernames: null,
      token: 'xxxxyyyyzzzz',
      verifyToken: 'test',
      appSecret: 'xxxxyyyyyzzzz',
      contextProvider: 'memory',
      logfile: null
    };

    assert.isNull(validators.platform.facebook(base));
    assert.isNull(validators.platform.facebook(_.extend({}, base, { profileFields: 'first_name'})));
    assert.isNotNull(validators.platform.facebook(_.extend({}, base, { appSecret: null})));
    assert.isNotNull(validators.platform.facebook(_.extend({}, base, { appSecret: ''})));
    assert.isNotNull(validators.platform.facebook(_.extend({}, base, { token: null})));
    assert.isNotNull(validators.platform.facebook(_.extend({}, base, { token: ''})));
    assert.isNotNull(validators.platform.facebook(_.extend({}, base, { contextProvider: 'wrong_context'})));
    assert.isNotNull(validators.platform.facebook(_.extend({}, base, { authorizedUsernames: 42})));
    assert.isNotNull(validators.platform.facebook(_.extend({}, base, { logfile: 42})));
    assert.isNotNull(validators.platform.facebook(_.extend({}, base, { profileFields: 42})));
  });

  it('validates a Twilio configuration', function() {
    var base = {
      authorizedUsernames: null,
      fromNumber: '+39123456',
      accountSid: '236472347623462376',
      authToken: 'aiqwgdkansljdeife',
      contextProvider: 'memory',
      logfile: null
    };

    assert.isNull(validators.platform.twilio(base));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { fromNumber: null})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { fromNumber: ''})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { authToken: null})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { authToken: ''})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { accountSid: null})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { accountSid: ''})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { contextProvider: 'wrong_context'})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { authorizedUsernames: 42})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { logfile: 42})));
  });

  it('validates a Routee configuration', function() {
    var base = {
      authorizedUsernames: null,
      fromNumber: '+39123456',
      appSecret: '236472347623462376',
      appId: '236472347623462376',
      accessToken: 'aiqwgdkansljdeife',
      contextProvider: 'memory',
      logfile: null
    };

    assert.isNull(validators.platform.routee(base));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { fromNumber: null})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { fromNumber: ''})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { accessToken: null})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { accessToken: ''})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { appId: null})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { appId: ''})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { appSecret: null})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { appSecret: ''})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { contextProvider: 'wrong_context'})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { authorizedUsernames: 42})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { logfile: 42})));
  });

  it('validates a MSTeams configuration', function() {
    var base = {
      authorizedUsernames: null,
      appId: '123456',
      appPassword: '236472347623462376',
      contextProvider: 'memory',
      logfile: null
    };

    assert.isNull(validators.platform.msteams(base));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { appPassword: null})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { accessappPasswordToken: ''})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { appId: null})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { appId: ''})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { contextProvider: 'wrong_context'})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { authorizedUsernames: 42})));
    assert.isNotNull(validators.platform.twilio(_.extend({}, base, { logfile: 42})));
  });

  it('validates a Alexa configuration', function() {
    var base = {
      authorizedUsernames: null,
      contextProvider: 'memory',
      logfile: null
    };

    assert.isNull(validators.platform.alexa(base));
    assert.isNotNull(validators.platform.alexa(_.extend({}, base, { contextProvider: 'wrong_context'})));
    assert.isNotNull(validators.platform.alexa(_.extend({}, base, { authorizedUsernames: 42})));
    assert.isNotNull(validators.platform.alexa(_.extend({}, base, { logfile: 42})));
  });

  it('validates an invoice', function() {

    var invoice = {
      title: "PostCard Bot",
      description :"Payment for Guido's postcard",
      payload:"196520947",
      prices: [{"label":"Color Postcard 10x15 cm","amount":"2.49"}],
      photoUrl: "http://res.cloudinary.com/guido-bellomo/image/upload/v1523858227/lxgmygzcxdmf0cle8vmk.jpg",
      photoHeight: 960,
      photoWidth: 1280,
      currency: 'EUR'
    };

    assert.isTrue(validators.invoice(invoice));
    assert.isFalse(validators.invoice(Object.assign(invoice, { photoWidth: null })));
    assert.isFalse(validators.invoice(Object.assign(invoice, { photoWidth: '{{variable}}' })));
    assert.isFalse(validators.invoice(Object.assign(invoice, { photoHeight: null })));
    assert.isFalse(validators.invoice(Object.assign(invoice, { title: null })));
    assert.isFalse(validators.invoice(Object.assign(invoice, { payload: null })));
    assert.isFalse(validators.invoice(Object.assign(invoice, { prices: null })));
    assert.isFalse(validators.invoice(Object.assign(invoice, { currency: null })));
  });

});

