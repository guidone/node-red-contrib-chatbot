const _ = require('underscore');
const { request } = require('../../../lib/helpers/utils');

module.exports = {

  getToken(appId, appSecret) {
    const secret = `${appId}:${appSecret}`;
    const basicToken = Buffer.alloc(secret.length, secret);
  
    return request({
      url: 'https://auth.routee.net/oauth/token',
      method: 'POST',
      headers: {
        authorization: `Basic ${basicToken.toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded'
      },
      form: {
        grant_type: 'client_credentials'
      }
    }).then(result => {
      let body;
      try {
        body = JSON.parse(result);
      } catch(e) {
        // do nothing
      }
      return body != null ? body.access_token : null;
    });
  },

  params(msg) {
    return (field, def) => {
      if (msg != null && msg.payload != null && msg.payload.params != null && msg.payload.params[field] != null) {
        return msg.payload.params[field];
      }
      return def;
    }
  },

  fixSenderNumber(number) {
    if (_.isString(number)) {
      return number.replace('+', '');
    }
    return number;
  },

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
