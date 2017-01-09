var nlp = require('nlp_compromise');
var _ = require('underscore');
var moment = require('moment');
var regexps = require('./helpers/regexps');
var levenshtein = require('fast-levenshtein');

var MatchRule = function(obj) {

  if (_.isString(obj)) {

    var parsed = obj.match(/([a-zA-Z0-9%$£# ]*){0,1}(\[[a-zA-Z0-9]*\]){0,1}(->[a-zA-Z0-9]*){0,1}/);

    if (parsed != null) {
      _.extend(this, {
        text: parsed[1] != null ? parsed[1] : null,
        type: parsed[2] != null ? parsed[2].replace('[', '').replace(']', '') : null,
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
      var matchType = (this.type === 'noun' && term.pos.Noun)
        || (this.type === 'adjective' && term.pos.Adjective)
        || (this.type === 'conjunction' && term.pos.Conjunction)
        || (this.type === 'adverb' && term.pos.Adverb)
        || (this.type === 'preposition' && term.pos.Preposition)
        || (this.type === 'determiner' && term.pos.Determiner)
        //|| (this.type === 'symbol' && term.pos.Symbol)
        || (this.type === 'word');
      // if the type is ok, capture the text or verify
      if (matchType) {
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
    },
    function(term) {
      // match exactly a symbol
      if (this.type === 'symbol' && term.pos.Symbol) {
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
      if (term.pos.Value) {
        if (this.type == 'number') {
          this.value = term.number;
          this.raw = term.text;
          return true;
        }

      }
      return false;

    },
    function(term) {
      // detect currency term, sometimes nlp chuncks two nouns, takes only the first one
      if (this.type === 'currency' && term.pos.Currency) {
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
      } else {
        return false;
      }
    },
    function(term) {
      // match a well formatted email
      //if (this.type === 'url' && regexps.url(term.text) != null) {
      if (this.type === 'url') {
        this.value = term.text;
        this.raw = term.text;
        return true;
      } else {
        return false;
      }
    },
    function(term) {
      // match a verb
      if (this.type === 'verb' && term.pos.Verb) {
        if (!_.isEmpty(this.text)) {
          if (this.text === term.text || this.text == term.root()) {
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
      if (this.type === 'person' && term.pos.Person) {
        if (!_.isEmpty(this.text)) {
          return this.text === term.text;
        } else {
          // catches all
          this.value = term.text;
          return true;
        }
      }
      return false;
    },
    function(term) {
      // match a date
      if (this.type === 'date' && term.pos.Date) {
        var date = moment();
        if (term.data.year != null) {
          date.year(term.data.year);
        }
        if (term.data.month != null) {
          date.month(term.data.month);
        }
        if (term.data.day != null) {
          date.date(term.data.day);
        }
        this.raw = term.text;
        this.value = date;
        return true;
      }
      return false;
    }

  ],

  debug: function() {
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
      } else {
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
    } else {
      // if the first term doesn't match, remove it and try to match the rest of the sentence, since we have discarded
      // a token, increase distance
      return matchRules(sentence.tail(), rules, distance + 1);
      // enqueue the found rules with the stack
      //matched.push.apply(matched, matchedWithSentenceTail);
    }


  }

  return [];

};


var matchLevenshtain = function(term, word) {

  // Get the Levenshtein distance based on the length of the word, for length = 2 distance must be 0 or "off" and "on"
  // will be confused

  var distance = null;
  if (term.length <= 2) {
    distance = 0
  } else if (term.length <= 4) {
    distance = 1;
  } else {
    distance = 2;
  }
//console.log('distance', distance);
  return levenshtein.get(term, word) <= distance;
};


module.exports = {
  Terms: Terms,
  MatchRules: MatchRules,
  MatchRule: MatchRule,
  matchRules: matchRules,

  matchRule: function(terms, rules) {

    var matches = matchRules(terms, rules)
    // todo improve detect here with distance
    return !_.isEmpty(matches) ? matches[0] : null;
  },

  matchLevenshtain: matchLevenshtain,

  /**
   * @method parseSentence
   * Parse a string with nlp-compromise with some corrections (like the currency with $ symbols)
   * @param {String} str
   * @return {Array}
   */
  parseSentence: function(str) {

    // detach symbols from leading labels, for example convert "40$" into "40 $", otherwise NLP is not able to parse
    // them correctly
    str = str.replace(/([0-9a-zA-Z]*)([%|$|€|£|#])/g, '$1 $2');

    var phrase = nlp.text(str);

    // correct currency symbols with the currency flag
    phrase.terms().forEach(function(term) {
      if (term.text == '$' || term.text == '€') {
        term.tag = 'Currency';
        term.pos.Currency = true;
        term.pos.Noun = true;
      }
    });

    return new Terms(phrase.terms());
  }


};

