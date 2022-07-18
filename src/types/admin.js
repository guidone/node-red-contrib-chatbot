import PropTypes from 'prop-types';

export default PropTypes.shape({
  avatar: PropTypes.string,
  chatbotIds: PropTypes.string,
  createdAt: PropTypes.string,
  email: PropTypes.string,
  first_name: PropTypes.string,
  id: PropTypes.number,
  last_name: PropTypes.string,
  password: PropTypes.string,
  payload: PropTypes.object,
  permissions: PropTypes.string,
  updatedAt: PropTypes.string,
  username: PropTypes.string
});
