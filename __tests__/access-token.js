const assert = require('chai').assert;
const { isValidAccessToken } = require('../lib/helpers/access-token');

const NOW = new Date('2026-10-04T12:00:00.000Z').getTime();
const record = payload => ({ payload: JSON.stringify(payload) });

describe('GraphQL access token check', () => {

  it('accepts a stored token that has not expired', () => {
    const contents = [record({ token: 'abc123', expire_at: '2027-01-01T00:00:00.000Z' })];
    assert.isTrue(isValidAccessToken('abc123', contents, NOW));
  });

  it('rejects a token that is not stored', () => {
    const contents = [record({ token: 'abc123', expire_at: '2027-01-01T00:00:00.000Z' })];
    assert.isFalse(isValidAccessToken('other', contents, NOW));
  });

  it('rejects a token whose expiration date has passed', () => {
    const contents = [record({ token: 'abc123', expire_at: '2026-01-01T00:00:00.000Z' })];
    assert.isFalse(isValidAccessToken('abc123', contents, NOW));
  });

  it('only looks at the matching record when another one has expired', () => {
    const contents = [
      record({ token: 'old', expire_at: '2025-01-01T00:00:00.000Z' }),
      record({ token: 'new', expire_at: '2027-01-01T00:00:00.000Z' })
    ];
    assert.isFalse(isValidAccessToken('old', contents, NOW));
    assert.isTrue(isValidAccessToken('new', contents, NOW));
  });

  it('keeps accepting tokens saved without an expiration date', () => {
    const contents = [record({ token: 'legacy' })];
    assert.isTrue(isValidAccessToken('legacy', contents, NOW));
  });

  it('rejects an empty token and ignores records it cannot parse', () => {
    const contents = [{ payload: 'not json' }, record({ token: '' })];
    assert.isFalse(isValidAccessToken('', contents, NOW));
    assert.isFalse(isValidAccessToken(undefined, contents, NOW));
  });

});
