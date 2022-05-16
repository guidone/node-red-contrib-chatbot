import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';

export default PropTypes.shape({
  username: PropTypes.string,
  ts: PropTypes.oneOfType([momentPropTypes, PropTypes.func]),
  content: PropTypes.string, // TODO aggiungere type buffer
  userId: PropTypes.string,
  buttons: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string
  }))
});