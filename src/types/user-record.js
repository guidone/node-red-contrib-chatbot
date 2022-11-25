import PropTypes from 'prop-types';

export default PropTypes.shape({
  userId: PropTypes.string,
  type: PropTypes.string,
  payload: PropTypes.object,
  title: PropTypes.string,
  status: PropTypes.string,
  transport: PropTypes.string,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  geohash: PropTypes.string,
  geohash_int: PropTypes.number,
  chatbotId: PropTypes.string
});
