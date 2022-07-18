import PropTypes from 'prop-types';
import momentPropTypes from 'react-moment-proptypes';

const TypeSimulatorMessage = PropTypes.shape({
  username: PropTypes.string,
  ts: momentPropTypes.momentObj,
  content: PropTypes.string,
  userId: PropTypes.string
});

export {
  TypeSimulatorMessage
};