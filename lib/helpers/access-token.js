const crypto = require('crypto');

const digest = value => crypto.createHash('sha256').update(value).digest();

// Compare digests so the check takes the same time wherever the strings differ.
const safeEqual = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

// A token saved without an expiration date keeps working. A date that cannot be read
// counts as expired, so a damaged record never grants access.
const isExpired = (expireAt, now) => {
  if (expireAt == null || expireAt === '') {
    return false;
  }
  const time = new Date(expireAt).getTime();
  return Number.isNaN(time) || time <= now;
};

// A bearer token is accepted when it matches the token stored in a record of the "tokens"
// namespace and that record has not expired.
const isValidAccessToken = (authToken, contents, now = Date.now()) => {
  if (typeof authToken !== 'string' || authToken === '') {
    return false;
  }
  return contents.some(content => {
    let json;
    try {
      json = JSON.parse(content.payload);
    } catch(e) {
      return false;
    }
    if (json == null || typeof json.token !== 'string' || json.token === '') {
      return false;
    }
    if (isExpired(json.expire_at, now)) {
      return false;
    }
    return safeEqual(authToken, json.token);
  });
};

module.exports = { isValidAccessToken };
