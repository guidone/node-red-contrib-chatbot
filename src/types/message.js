import PropTypes from 'prop-types';

export default PropTypes.shape({
  username: PropTypes.string,
  ts: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  content: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  userId: PropTypes.string,
  buttons: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string
  }))
});