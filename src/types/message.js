import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';

export default PropTypes.shape({
  username: PropTypes.string,
  ts: PropTypes.oneOfType([momentPropTypes.momentObj, PropTypes.func]),
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