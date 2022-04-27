import PropTypes from 'prop-types';

export const TypePlugin = PropTypes.shape({
  name: PropTypes.string,
  version: PropTypes.string,
  redbot_version: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  repository: PropTypes.string,
  flow: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  user_created: PropTypes.shape({
    url: PropTypes.string,
    nickname: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string
  })
});
