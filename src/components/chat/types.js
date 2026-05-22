import PropTypes from 'prop-types';

const TypeSimulatorMessage = PropTypes.shape({
  username: PropTypes.string,
  ts: PropTypes.string,
  content: PropTypes.string,
  userId: PropTypes.string
});

export {
  TypeSimulatorMessage
};