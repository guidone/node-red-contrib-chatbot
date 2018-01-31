var nlp = require('compromise');
var _ = require('underscore');
var _s = require('underscore.string');
var chrono = require('chrono-node');
var regexps = require('./helpers/regexps');
var levenshtein = require('fast-levenshtein');
var clc = require('cli-color');
var prettyjson = require('prettyjson');

var green = clc.greenBright;
var white = clc.white;
var grey = clc.blackBright;

var matchLevenshtain = function(term, word) {
  // get the Levenshtein distance based on the length of the word, for length = 2 distance must be 0 or "off" and "on"
  // will be confused
  var distance = null;
  if (term.length <= 2) {
    distance = 0
  } else if (term.length <= 4) {
    distance = 1;
  } else {
    distance = 2;
  }
  return levenshtein.get(term, word) <= distance;
};

var MatchRule = function(obj) {

  if (_.isString(obj)) {

    var parsed = obj.match(/([a-zA-Z0-9%$£# ]*){0,1}(\[[a-zA-Z0-9]*\]){0,1}(->[a-zA-Z0-9_]*){0,1}/);

    if (parsed != null) {
      _.extend(this, {
        text: parsed[1] != null ? parsed[1] : null,
        type: parsed[2] != null ? parsed[2].replace('[', '').replace(']', '') : 'word',
        variable: parsed[3] != null ? parsed[3].replace('->', '') : null,
        value: null,
        distance: 0
      });
    }

  } else if (_.isObject(obj)) {

    _.extend(this, {
      text: null,
      type: null,
      variable: null,
      value: null,
      distance: 0,
      raw: null
    }, obj);
  }

  return this;
};

/*

todo
- add city: String,     // Toronto, Canada -> Toronto, region: String,   // Toronto, Ontario -> Ontario, country: String,
- add float
- add monday

 */

_.extend(MatchRule.prototype, {

  _matchingRules: [
    function(term) {
      // match if type if not specified, just use lev
      if (_.isEmpty(this.type) && !_.isEmpty(this.text)) {
        if (matchLevenshtain(this.text, term.text)) {
          this.raw = term.text;
          return true;
        }
      }
      return false;
    },
    function(term) {
      // match exactly a symbol
      if (this.type === 'symbol' && term.tags.Symbol) {
        if (!_.isEmpty(this.text)) {
          if (this.text === term.text) {
            this.raw = term.text;
            return true;
          }
        } else {
          // catches all
          this.value = term.text;
          this.raw = term.text;
          return true;
        }
      }
      return false;
    },
    function(term) {
      // this rule match a numeric value, improve it with keywords like float or integer
      if (this.type === 'number' && term.tags.Cardinal) {
        if (_.isEmpty(this.text)) {
          if (_.isNumber(term.value)) {
            this.value = parseFloat(term.value);
            this.raw = term.text;
            return true;
          } else if (term.value.indexOf(',') !== -1 || term.value.indexOf('.') !== -1) {
            if (!isNaN(parseFloat(term.value))) {
              this.value = parseFloat(term.value);
              this.raw = term.text;
              return true;
            }
          } else if (!isNaN(parseInt(term.value, 10))) {
            this.value = parseInt(term.value, 10);
            this.raw = term.text;
            return true;
          }
        }
      }
      return false;
    },
    function(term) {
      // detect currency term, sometimes nlp chuncks two nouns, takes only the first one
      if (this.type === 'currency' && term.tags.Currency) {
        this.value = term.text.split(' ')[0];
        this.raw = term.text;
        return true;
      }
      return false;

    },
    function(term) {
      // match a well formatted email
      if (this.type === 'email' && regexps.email(term.text) != null) {
        this.value = term.text;
        this.raw = term.text;
        return true;
      }
      return false;
    },
    function(term) {
      // match a well formatted url
      // todo check here url type
      if (this.type === 'url' && regexps.url(term.text) != null) {
        this.value = term.text;
        this.raw = term.text;
        return true;
      }
      return false;
    },
    function(term) {
      // match a verb
      if (this.type === 'verb' && term.tags.Verb) {
        if (!_.isEmpty(this.text)) {
          if (this.text === term.text || this.text === term.infinitive) {
            this.raw = term.text;
            return true;
          }
        } else {
          // catches all
          this.value = term.text;
          this.raw = term.text;
          return true;
        }
      }
      return false;
    },
    function(term) {
      // match a person
      if (this.type === 'person' && term.tags.Person) {
        if (!_.isEmpty(this.text)) {
          return this.text === term.text;
        }
        // catches all
        this.value = term.text;
        return true;
      }
      return false;
    },
    function(term) {
      // match a date
      if (this.type === 'date' && term.tags.Date) {
        this.raw = term.text;
        this.value = chrono.parseDate(term.text);
        this.text = term.text;
        return true;
      }
      return false;
    },
    function(term) {
      // do not try to match verbs, levenhstain could confuse "off" with "on" in phrasal verbs, also
      // it doesn't catch infinitive, checked in a following rule
      if (this.type === 'verb' || this.type === 'date') {
        return false;
      }
      var capitalizedType = _s.capitalize(this.type);
      // if the type is ok, capture the text or verify, nlp-compromise types are always capitalized (like noun),
      // while custom lexicons can be in any case (that explains the double or)
      if (term.tags[capitalizedType] || term.tags[this.type] || this.type === 'word') {
        if (!_.isEmpty(this.text)) {
          if (matchLevenshtain(this.text, term.text)) {
            this.raw = term.text;
            return true;
          }
        } else {
          // catches all
          this.value = term.text;
          this.raw = term.text;
          return true;
        }
      }
      return false;
    }
  ],

  debug: function() {
    // eslint-disable-next-line no-console
    console.log(this.toJSON());
  },

  clone: function() {
    return new MatchRule(this.toJSON());
  },

  toJSON: function() {
    return {
      text: this.text,
      type: this.type,
      variable: this.variable,
      value: this.value,
      distance: this.distance,
      raw: this.raw
    };
  },

  /**
   * @method match
   * Check if the term matches a rule
   * @param {Term} term
   * @return {Boolean}
   */
  match: function(term) {
    var _this = this;
    return _(this._matchingRules).any(function(func) {
      return func.call(_this, term);
    });
  }
});


var MatchRules = function(objs) {

  var _this = this;
  _this._models = [];
  if (_.isArray(objs)) {
    objs.forEach(function(obj) {
      _this._models.push(new MatchRule(obj));
    });
  }

};

_.extend(MatchRules.prototype, {

  prepend: function(rule) {
    this._models.unshift(rule);
    return this;
  },

  count: function() {
    return this._models.length;
  },

  clone: function() {
    return new MatchRules(this.map(function(rule) {
      return rule.toJSON();
    }));
  },

  map: function(func) {
    return _(this._models).map(func);
  },

  forEach: function(func) {
    _(this._models).each(func);
    return this;
  },

  /**
   * @method head
   * Get the first rule of the set
   * @return {MatchRule}
   */
  head: function() {
    return this.count() >= 1 ? this._models[0] : null;
  },

  at: function(idx) {
    return idx < this._models.length ? this._models[idx] : null;
  },

  /**
   * @method empty
   * Tells if the rules collection is empty
   * @return {Boolean}
   */
  empty: function() {
    return this.count() === 0;
  },

  toJSON: function() {
    return this.map(function(rule) {
      return rule.toJSON();
    });
  },

  /**
   * @method tail
   * Return a cloned element of the rules, except the first one
   * @return {MatchRules}
   */
  tail: function() {
    return new MatchRules(_(this.toJSON()).tail());
  }

});

/**
 * @class Terms
 * A collection of parsed terms from a sentence}
 */
var Terms = function(terms) {

  this._terms = terms;

  return this;
};

_.extend(Terms.prototype, {

  debug: function() {
    // eslint-disable-next-line no-console
    console.log(this._terms);
  },

  count: function() {
    return this._terms.length;
  },

  head: function() {
    return this.count() >= 1 ? this._terms[0] : null;
  },

  at: function(idx) {
    return idx < this._terms.length ? this._terms[idx] : null;
  },



  /**
   * @method empty
   * Tells if the terms collection is empty
   * @return {Boolean}
   */
  empty: function() {
    return this.count() === 0;
  },

  /**
   * @method tail
   * Return a cloned version of the terms, excluded the first one
   * @return {Terms}
   */
  tail: function() {
    return new Terms(_(this._terms).tail());
  }

});

var matchRules = function(sentence, rules, distance) {

  distance = distance || 0;

  //var matched = [];
  // if there something
  if (!sentence.empty() && !rules.empty()) {
    // always clone the rule before matching (the match stores data into the rule), no side effects here
    var clonedRules = rules.clone();
    // che if top rule match with top term
    if (clonedRules.head().match(sentence.head())) {
      // set the distance that matched
      clonedRules.head().distance = distance;
      // if just one rules is left means we're done here and the whole sentence is matched
      // return the cloned rules then
      if (clonedRules.count() == 1) {
        return [clonedRules];
      }
      // not done yet, we have to check more rules, so tail both the sentence terms and the rules and
      // check again, resets the distance
      var matchedWithBothTailed = matchRules(sentence.tail(), clonedRules.tail());
      // for each of the matched rules, I've to prepend the previous head checked in this round
      _(matchedWithBothTailed).each(function(rule) {
        rule.prepend(clonedRules.head());
      });
      // can be a match also with the rules without tailing it, for example if we're searching for a
      // [noun] [color] it could match "[car] is a bmw [blue]" but also "car is a [bmw] [blue]",
      // so we're tailing the terms but not the rules
      var matchedWithSentenceTailed = matchRules(sentence.tail(), clonedRules);
      // join all together
      return _.compact(_.union(matchedWithBothTailed, matchedWithSentenceTailed));
    }
    // if the first term doesn't match, remove it and try to match the rest of the sentence, since we have discarded
    // a token, increase distance
    return matchRules(sentence.tail(), rules, distance + 1);
    // enqueue the found rules with the stack
    //matched.push.apply(matched, matchedWithSentenceTail);
  }

  return [];
};

function stopWord(terms, word, type) {
  _(terms).each(function(term) {
    if ((_.isEmpty(word) || term._text === word) && term.tags[type]) {
      term.tags = {};
      term.tags[type] = true;
    }
  });
}

/**
 * @method groupSiblings
 * Given a list of terms, groupo together terms with the same type
 */
function groupSiblings(terms, type, excludedTypes) {

  var accumulator = [];
  var temp = [];
  var k = 0;
  excludedTypes = excludedTypes || [];

  // do it old school
  for(k = 0; k < terms.length; k++) {
    var term = terms[k];
    var isLast = k === terms.length - 1;
    var nextTerm = !isLast ? terms[k + 1] : null;
    // add to the temp registry if it's the right type, or just to the accumulator if not
    if (term.tags[type]) {
      temp.push(term);
      // if the next term has a type included in "excludedTypes" then skip it
      var excludesNext = nextTerm != null ? !_.isEmpty(_.intersection(_(nextTerm.tags).keys(), excludedTypes)) : false;
      // if it's the last one or the next one is a different kind and in the temporary registry there are more than 1
      // terms, then join them
      if (isLast || !nextTerm.tags[type] || excludesNext) {
        if (temp.length > 0) {
          // join them and evaluate in isolation
          var joined = _(temp).map(function (term) {
            return term.root;
          }).join(' ');
          var isolated = nlp(joined);
          // switch based on type
          var parsed = null;
          switch (type) {
            case 'Date':
              parsed = isolated.dates(0).data();
              temp[0]._text = joined;
              accumulator.push(temp[0]);
              break;
            case 'Cardinal':
              parsed = isolated.values(0).data();
              temp[0].value = parsed[0].number;
              temp[0]._text = joined;
              accumulator.push(temp[0]);
              break;
            case 'Verb':
              parsed = isolated.verbs(0).data();
              temp[0].infinitive = parsed.length !== 0 && parsed[0].conjugations != null ?
                parsed[0].conjugations.Infinitive : joined;
              temp[0]._text = joined;
              accumulator.push(temp[0]);
              break;
            default:
              temp[0]._text = joined;
              temp[0].normal = joined;
              temp[0].root = joined;
              accumulator.push(temp[0]);
          }
          // reset the temp register
          temp = [];
        }
      }
    } else {
      accumulator.push(term);
    }

    // else do nothing
  } // end for

  return accumulator;
}


module.exports = {
  Terms: Terms,
  MatchRules: MatchRules,
  MatchRule: MatchRule,
  matchRules: matchRules,

  matchRule: function(terms, rules) {

    var matches = matchRules(terms, rules);
    // todo improve detect here with distance
    return !_.isEmpty(matches) ? matches[0] : null;
  },

  matchLevenshtain: matchLevenshtain,

  /**
   * @method parseSentence
   * Parse a string with nlp-compromise with some corrections (like the currency with $ symbols)
   * @param {String} str
   * @param {Object} lexicon
   * @param {Boolean} debug
   * @return {Array}
   */
  parseSentence: function(str, lexicon, debug) {

    // detach symbols from leading labels, for example convert "40$" into "40 $", otherwise NLP is not able to parse
    // them correctly
    str = str.replace(/([0-9a-zA-Z]*)([%|$|€|£|#])/g, '$1 $2');

    //var phrase = nlp.text(str, lexicon.lexicon);
    var phrase = nlp(str, lexicon);

    if (debug) {
      // eslint-disable-next-line no-console
      console.log(green('Message:'), white(str));
      phrase.debug();
    }

    // collect new entity from lexicon
    var entities = _(lexicon).chain().values().unique().value();

    //this._phrase = phrase;
    var terms = _(phrase.list).chain()
      .map(function(list) {
        return list.terms;
      })
      .flatten()
      .value();
    // manually mark as Symbol
    terms.forEach(function(term) {
      if (term.normal.match(/[%|$|€|£|#]/)) {
        term.tags.Symbol = true;
      }
    });
    // clear stop word, some word must be a kind of separator, for example in the sentece "from 1st january to 10th
    // january" all is marked "Date", even the word "to" which cause the grouping by the type "Date" of the whole
    // sentence. Some word are just one type, "to" is a "Preposition" and nothing else
    stopWord(terms, null, 'Preposition');
    // need to group token to extract the right value "twenty four" are two separate terms, this will join them
    // together with a parsed "value" key
    terms = groupSiblings(terms, 'Cardinal');
    terms = groupSiblings(terms, 'Verb');
    // join Date elements but only if they are not "Duration", for example "in 8 minutes" could be grouped all in a single
    // date element, but since "in" is a preposition and "minutes" is Duration, then don't join them
    terms = groupSiblings(terms, 'Date', ['Duration']);
    // also group together new entities from lexicon, i.e. "dining room" gets splitted in "dining" and "room"
    _(entities).each(function(entity) {
      terms = groupSiblings(terms, entity);
    });

    if (debug) {
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(grey('------ Sentence Analysis ----------------'));
      try {
        // eslint-disable-next-line no-console
        console.log(prettyjson.render(
          _(terms).map(function(term) {
            return _(term).pick('tags', 'whitespace', 'silent_term', 'lumped', 'normal', 'root', 'dirty', 'uid', '_text');
          })
        ));
      } catch(e) {
        // pretty json may breaks
      }
    }

    return new Terms(terms);
  }
};



