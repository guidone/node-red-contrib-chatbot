const _ = require('underscore');

module.exports = {

  fixNumber(numberToFix) {

    if (_.isEmpty(numberToFix)) {
      return numberToFix;
    }

    let number = null;
    let scheme = null;
    const matchScheme = numberToFix.match(/^(.*):(.*)$/);

    if (matchScheme == null) {
      number = numberToFix;
    } else {
      scheme = matchScheme[1];
      number = matchScheme[2];
    }
    // add the leading + if missing
    if (!number.match(/^\+/)) {
      number = '+' + number;
    }

    return !_.isEmpty(scheme) ? scheme + ':' + number : number;
  }

};
