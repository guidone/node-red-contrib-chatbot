var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var MessageBlock = require('../nodes/chatbot-message');

var NplMatcher = require('../lib/npl-matcher');

describe('NLP matcher', function() {

  it('should init, get some terms, tail a terms', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);

    assert.equal(terms.head().text, 'the');
    assert.isTrue(terms.head().tags['Determiner']);

    assert.equal(terms.at(1).text, 'check');
    assert.isTrue(terms.at(1).tags['Noun']);


    var tailed = terms.tail();
    assert.equal(tailed.at(0).text, 'check');
    assert.isTrue(tailed.at(0).tags['Noun']);

  });

  it('should create a rule from string', function() {

    var rule = new NplMatcher.MatchRule('check[noun]->myvariable');

    assert.equal(rule.text, 'check');
    assert.equal(rule.type, 'noun');
    assert.equal(rule.variable, 'myvariable');

    rule = new NplMatcher.MatchRule('[adjective]->var2');

    assert.isNull(rule.text);
    assert.equal(rule.type, 'adjective');
    assert.equal(rule.variable, 'var2');

    rule = new NplMatcher.MatchRule('[currency]');

    assert.isNull(rule.text);
    assert.equal(rule.type, 'currency');
    assert.isNull(rule.variable);


  });


  it('should clone properly a rule', function() {

    var rule = new NplMatcher.MatchRule({
      text: 'check',
      type: 'noun',
      variable: '42'
    });

    assert.equal(rule.text, 'check');
    assert.equal(rule.type, 'noun');
    assert.equal(rule.variable, '42');

    var cloned = rule.clone();
    cloned.variable = '84';

    assert.equal(rule.text, 'check');
    assert.equal(rule.type, 'noun');
    assert.equal(rule.variable, '42');

    assert.equal(cloned.text, 'check');
    assert.equal(cloned.type, 'noun');
    assert.equal(cloned.variable, '84');
  });

  it('should create return a json list rules', function() {

    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    var json = rules.toJSON();

    assert.isArray(json);

    assert.isObject(json[0]);
    assert.equal(json[0].text, 'check');
    assert.equal(json[0].type, 'noun');
    assert.isNull(json[0].variable);

    assert.isObject(json[1]);
    assert.isNull(json[1].text);
    assert.equal(json[1].type, 'number');
    assert.equal(json[1].variable, 'total');

    assert.isObject(json[2]);
    assert.isNull(json[2].text);
    assert.equal(json[2].type, 'currency');
    assert.equal(json[2].variable, 'currency');


  });

  it('should tail a list of rules', function() {

    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    var tailed = rules.tail();

    assert.equal(tailed.count(), 2);

    assert.isNull(tailed.at(0).text);
    assert.equal(tailed.at(0).type, 'number');
    assert.equal(tailed.at(0).variable, 'total');

    assert.isNull(tailed.at(1).text);
    assert.equal(tailed.at(1).type, 'currency');
    assert.equal(tailed.at(1).variable, 'currency');

    // now prepend

    tailed.prepend(new NplMatcher.MatchRule({
      text: 'front',
      type: 'noun'
    }));

    assert.equal(tailed.at(0).text, 'front');
    assert.equal(tailed.at(0).type, 'noun');

  });


  it('should match if type is the same and text is the same', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    assert.isTrue(rules.at(0).match(terms.at(1)));


  });

  it('should match a type number without text and store the value', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    assert.isTrue(rules.at(1).match(terms.at(3)));
    assert.equal(rules.at(1).variable, 'total');
    assert.equal(rules.at(1).value, 36);

  });

  it('should match a type currency without text and store the value', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    assert.isTrue(rules.at(2).match(terms.at(4)));
    assert.equal(rules.at(2).variable, 'currency');
    assert.equal(rules.at(2).value, 'dollars');

  });

  it('should create a rule list', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    var cloned = rules.clone();

    assert.equal(rules.count(), 3);
    assert.equal(cloned.count(), 3);
    assert.equal(terms.count(), 14);

    assert.equal(rules.head().text, 'check');
    assert.equal(rules.head().type, 'noun');

    assert.equal(rules.at(0).text, 'check');
    assert.equal(rules.at(0).type, 'noun');

    assert.equal(rules.at(1).type, 'number');
    assert.equal(rules.at(1).variable, 'total');

  });

  it('should parse a sentence', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);

    assert.equal(terms.count(), 14);

  });

  it('match a restaurant check sentence', function() {


    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    var matchedRules = NplMatcher.matchRules(terms, rules);


    assert.equal(matchedRules[0].at(0).type, 'noun');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'number');
    assert.equal(matchedRules[0].at(1).value, 36);
    assert.equal(matchedRules[0].at(1).distance, 1);

    assert.equal(matchedRules[0].at(2).type, 'currency');
    assert.equal(matchedRules[0].at(2).value, 'dollars');
    assert.equal(matchedRules[0].at(2).distance, 0);


    /*_(matchedRules).each(function(rules, idx) {
      console.log('');
      console.log('Rule #' + (idx + 1));
      console.log(rules.toJSON());
    });*/

  });

  it('match a restaurant check sentence also with tip', function() {


    var message = 'the check is 36.6 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      },
      {
        text: 'tip',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency'
      }
    ]);

    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*_(matchedRules).each(function(rules, idx) {
      console.log('');
      console.log('Rule #' + (idx + 1));
      console.log(rules.toJSON());
    });*/

    assert.equal(rules.count(), 6);

    assert.equal(matchedRules[0].at(0).type, 'noun');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'number');
    assert.equal(matchedRules[0].at(1).value, 36.6);
    assert.equal(matchedRules[0].at(1).distance, 1);

    assert.equal(matchedRules[0].at(2).type, 'currency');
    assert.equal(matchedRules[0].at(2).value, 'dollars');
    assert.equal(matchedRules[0].at(2).distance, 0);

    assert.equal(matchedRules[0].at(3).type, 'noun');
    assert.equal(matchedRules[0].at(3).distance, 5);

    assert.equal(matchedRules[0].at(4).type, 'number');
    assert.equal(matchedRules[0].at(4).value, 5);
    assert.equal(matchedRules[0].at(4).distance, 1);

    assert.equal(matchedRules[0].at(5).type, 'currency');
    assert.equal(matchedRules[0].at(5).value, '$');
    assert.equal(matchedRules[0].at(5).distance, 0);


  });


  it('should match two sets of rules with adjective car and color', function() {

    var message = 'the vehicle is a car blue';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        type: 'noun'
      },
      {
        type: 'adjective',
        variable: 'color'
      }
    ]);

    var matchedRules = NplMatcher.matchRules(terms, rules);

    assert.equal(matchedRules[0].at(0).type, 'noun');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'adjective');
    assert.equal(matchedRules[0].at(1).value, 'blue');
    assert.equal(matchedRules[0].at(1).distance, 3);

  });


  it('should match a sentence with an email', function() {

    var message = 'my email is guido.bellomo@gmail.com';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'email',
        type: 'noun'
      },
      {
        type: 'email',
        variable: 'myemail'
      }
    ]);

    var matchedRules = NplMatcher.matchRules(terms, rules);

    assert.equal(matchedRules[0].count(), 2);

    assert.equal(matchedRules[0].at(0).type, 'noun');
    assert.equal(matchedRules[0].at(0).text, 'email');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'email');
    assert.equal(matchedRules[0].at(1).value, 'guido.bellomo@gmail.com');
    assert.equal(matchedRules[0].at(1).distance, 1);

    /*_(matchedRules).each(function(rules, idx) {
      console.log('');
      console.log('Rule #' + (idx + 1));
      console.log(rules.toJSON());
    });*/

  });


  /*it.only('should match a sentence with a date', function() {

    var message = 'I will call Jack on 10 January';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'call',
        type: 'verb'
      },
      {
        type: 'person',
        variable: 'who'
      },
      {
        type: 'date',
        variable: 'when'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    assert.equal(matchedRules[0].count(), 3);

    assert.equal(matchedRules[0].at(0).type, 'verb');
    assert.equal(matchedRules[0].at(0).text, 'call');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'person');
    assert.equal(matchedRules[0].at(1).value, 'Jack');
    assert.equal(matchedRules[0].at(1).variable, 'who');
    assert.equal(matchedRules[0].at(1).distance, 0);

    assert.equal(matchedRules[0].at(2).type, 'date');
    assert.equal(matchedRules[0].at(2).value.date(), 10);
    assert.equal(matchedRules[0].at(2).value.month(), 0);
    assert.equal(matchedRules[0].at(2).distance, 1);

  });*/

  it('should match number written in letters', function() {

    var message = 'I owe forty five apples to Jimmy';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        type: 'verb',
        text: 'owe'
      },
      {
        type: 'number',
        variable: 'age'
      },
      {
        text: 'apple',
        type: 'noun'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 3);

    assert.equal(matchedRules[0].at(0).type, 'verb');
    assert.equal(matchedRules[0].at(0).text, 'owe');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'number');
    assert.equal(matchedRules[0].at(1).value, 45);
    assert.equal(matchedRules[0].at(1).variable, 'age');
    assert.equal(matchedRules[0].at(1).distance, 0);

    assert.equal(matchedRules[0].at(2).type, 'noun');
    assert.equal(matchedRules[0].at(2).text, 'apple');
    assert.equal(matchedRules[0].at(2).raw, 'apples');

  });

  it('I should parse I weight 48.7 kg', function() {

    var message = 'I weight 48.7 kg';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        type: 'verb',
        text: 'weight'
      },
      {
        type: 'number',
        variable: 'kgs'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 2);

    assert.equal(matchedRules[0].at(0).type, 'verb');
    assert.equal(matchedRules[0].at(0).text, 'weight');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'number');
    assert.equal(matchedRules[0].at(1).value, 48.7);
    assert.equal(matchedRules[0].at(1).variable, 'kgs');
    assert.equal(matchedRules[0].at(1).distance, 0);
  });

  it('should understand negated sentences', function() {

    var message = 'I will not pay 450 $ for these shoes';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      'not[negative]',
      'pay[verb]',
      '[number]->amount',
      '[currency]->currency',
      'for',
      '[noun]->what'
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    //console.log('---', terms);
    assert.lengthOf(matchedRules, 1);
    assert.equal(matchedRules[0].count(), 6);

    assert.equal(matchedRules[0].at(0).type, 'negative');
    assert.equal(matchedRules[0].at(0).text, 'not');
    assert.equal(matchedRules[0].at(0).distance, 2);

    assert.equal(matchedRules[0].at(1).type, 'verb');
    assert.equal(matchedRules[0].at(1).text, 'pay');
    assert.equal(matchedRules[0].at(1).distance, 0);

    assert.equal(matchedRules[0].at(2).type, 'number');
    assert.equal(matchedRules[0].at(2).value, 450);
    assert.equal(matchedRules[0].at(2).distance, 0);
    assert.equal(matchedRules[0].at(2).variable, 'amount');

    assert.equal(matchedRules[0].at(3).type, 'currency');
    assert.equal(matchedRules[0].at(3).value, '$');
    assert.equal(matchedRules[0].at(3).distance, 0);
    assert.equal(matchedRules[0].at(3).variable, 'currency');

    assert.equal(matchedRules[0].at(4).text, 'for');
    assert.equal(matchedRules[0].at(4).raw, 'for');

    assert.equal(matchedRules[0].at(5).type, 'noun');
    assert.equal(matchedRules[0].at(5).value, 'shoes');
    assert.equal(matchedRules[0].at(5).distance, 1);
    assert.equal(matchedRules[0].at(5).variable, 'what');

  });

  it('should match myself saying my name', function() {

    var message = 'My name is Jack';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'name'
      },
      {
        text: 'is'
      },
      {
        type: 'person',
        variable: 'name'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 3);

    assert.isNull(matchedRules[0].at(0).type);
    assert.equal(matchedRules[0].at(0).text, 'name');
    assert.equal(matchedRules[0].at(0).raw, 'name');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.isNull(matchedRules[0].at(1).type);
    assert.equal(matchedRules[0].at(1).text, 'is');
    assert.equal(matchedRules[0].at(1).raw, 'is');
    assert.equal(matchedRules[0].at(1).distance, 0);

    assert.equal(matchedRules[0].at(2).type, 'person');
    assert.equal(matchedRules[0].at(2).value, 'Jack');
    assert.equal(matchedRules[0].at(2).distance, 0);

  });

  it('should parse a percentage', function() {

    var message = '40 %';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        type: 'number',
        variable: 'value'
      },
      {
        type: 'symbol'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 2);

    assert.equal(matchedRules[0].at(0).type, 'number');
    assert.equal(matchedRules[0].at(0).value, 40);
    assert.equal(matchedRules[0].at(0).raw, '40');
    assert.equal(matchedRules[0].at(0).distance, 0);

    assert.equal(matchedRules[0].at(1).type, 'symbol');
    assert.equal(matchedRules[0].at(1).value, '%');
    assert.equal(matchedRules[0].at(1).raw, '%');
    assert.equal(matchedRules[0].at(1).distance, 0);
  });

  it('should parse a percentage with symbol attached to the number', function() {

    var message = '40%';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        type: 'number',
        variable: 'value'
      },
      {
        type: 'symbol'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 2);

    assert.equal(matchedRules[0].at(0).type, 'number');
    assert.equal(matchedRules[0].at(0).value, 40);
    assert.equal(matchedRules[0].at(0).raw, '40');
    assert.equal(matchedRules[0].at(0).distance, 0);

    assert.equal(matchedRules[0].at(1).type, 'symbol');
    assert.equal(matchedRules[0].at(1).value, '%');
    assert.equal(matchedRules[0].at(1).raw, '%');
    assert.equal(matchedRules[0].at(1).distance, 0);

  });

  it('should parse a currency with symbol attached to the number', function() {

    var message = 'amount is 40$ and taxes 10.2%';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        type: 'number',
        variable: 'amount'
      },
      {
        type: 'currency',
        variable: 'currency'
      },
      {
        type: 'noun',
        text: 'taxes'
      },
      {
        type: 'number',
        variable: 'taxes'
      },
      {
        type: 'symbol',
        text: '%'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 5);

    assert.equal(matchedRules[0].at(0).type, 'number');
    assert.equal(matchedRules[0].at(0).value, 40);
    assert.equal(matchedRules[0].at(0).raw, '40');
    assert.equal(matchedRules[0].at(0).distance, 2);

    assert.equal(matchedRules[0].at(1).type, 'currency');
    assert.equal(matchedRules[0].at(1).value, '$');
    assert.equal(matchedRules[0].at(1).raw, '$');
    assert.equal(matchedRules[0].at(1).distance, 0);

    assert.equal(matchedRules[0].at(2).type, 'noun');
    assert.isNull(matchedRules[0].at(2).value);
    assert.equal(matchedRules[0].at(2).raw, 'taxes');
    assert.equal(matchedRules[0].at(2).distance, 1);

    assert.equal(matchedRules[0].at(3).type, 'number');
    assert.equal(matchedRules[0].at(3).value, 10.2);
    assert.equal(matchedRules[0].at(3).variable, 'taxes');
    assert.equal(matchedRules[0].at(3).raw, '10.2');
    assert.equal(matchedRules[0].at(3).distance, 0);

    assert.equal(matchedRules[0].at(4).type, 'symbol');
    assert.equal(matchedRules[0].at(4).text, '%');
    assert.equal(matchedRules[0].at(4).raw, '%');
    assert.equal(matchedRules[0].at(4).distance, 0);

  });

  it('should match past form of a verb', function() {

    var message = 'I told you the truth';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        type: 'verb',
        text: 'tell'
      },
      {
        type: 'noun',
        text: 'truth'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 2);

    assert.equal(matchedRules[0].at(0).type, 'verb');
    assert.equal(matchedRules[0].at(0).text, 'tell');
    assert.equal(matchedRules[0].at(0).raw, 'told');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'noun');
    assert.equal(matchedRules[0].at(1).text, 'truth');
    assert.equal(matchedRules[0].at(1).distance, 2);

  });

  it('should match a url', function() {

    var message = 'I am reading http://javascript-jedi.com';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        type: 'verb',
        text: 'am reading'
      },
      {
        type: 'url',
        variable: 'address'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 2);

    assert.equal(matchedRules[0].at(0).type, 'verb');
    assert.equal(matchedRules[0].at(0).text, 'am reading');
    assert.equal(matchedRules[0].at(0).raw, 'am reading');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'url');
    assert.equal(matchedRules[0].at(1).variable, 'address');
    assert.equal(matchedRules[0].at(1).value, 'http://javascript-jedi.com');
    assert.equal(matchedRules[0].at(1).distance, 0);

  });

  it('should match a verb with preposition', function() {

    var message = 'switch on lights dining room';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      'switch on','dining','room'
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 3);

    assert.equal(matchedRules[0].at(0).text, 'switch on');
    assert.equal(matchedRules[0].at(0).distance, 0);

    assert.equal(matchedRules[0].at(1).text, 'dining');
    assert.equal(matchedRules[0].at(1).distance, 1);

    assert.equal(matchedRules[0].at(2).text, 'room');
    assert.equal(matchedRules[0].at(2).distance, 0);

  });

  it('should match sentenct with just the variable', function() {

    var message = 'send cv to guido.bellomo@gmail.com';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      'send', 'cv', 'to', '->email'
    ]);


    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 4);

    assert.equal(matchedRules[0].at(0).text, 'send');
    assert.equal(matchedRules[0].at(0).distance, 0);

    assert.equal(matchedRules[0].at(1).text, 'cv');
    assert.equal(matchedRules[0].at(1).distance, 0);

    assert.equal(matchedRules[0].at(2).text, 'to');
    assert.equal(matchedRules[0].at(2).distance, 0);

    assert.equal(matchedRules[0].at(3).value, 'guido.bellomo@gmail.com');
    assert.equal(matchedRules[0].at(3).distance, 0);

  });

  it('should match witch custom lexicon', function() {

    var message = 'switch on lights kitchen';
    var terms = NplMatcher.parseSentence(message, {
      'dining room': 'Room',
      'kitchen': 'Room',
      'toilette': 'Room',
      'lavatory': 'Room',
      'basement': 'Room'
    });
    var rules = new NplMatcher.MatchRules([
      {
        type: 'verb',
        text: 'switch on'
      },
      {
        text: 'lights'
      },
      {
        type: 'room',
        variable: 'room'
      }
    ]);
    var matchedRules = NplMatcher.matchRules(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

    assert.equal(matchedRules[0].count(), 3);

    assert.equal(matchedRules[0].at(0).text, 'switch on');
    assert.equal(matchedRules[0].at(0).distance, 0);

    assert.equal(matchedRules[0].at(1).text, 'lights');
    assert.equal(matchedRules[0].at(1).distance, 0);

    assert.equal(matchedRules[0].at(2).text, null);
    assert.equal(matchedRules[0].at(2).value, 'kitchen');
    assert.equal(matchedRules[0].at(2).variable, 'room');
    assert.equal(matchedRules[0].at(2).distance, 0);

  });

});

