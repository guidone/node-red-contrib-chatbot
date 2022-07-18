import _ from 'lodash';

export default user => {
  if (!_.isEmpty(user.first_name) || !_.isEmpty(user.last_name)) {
    return [user.first_name, user.last_name].filter(s => !_.isEmpty(s)).join(' ');
  } else if (!_.isEmpty(username)) {
    return user.username;
  } else {
    return `Anonymous (id: {id})`;
  }
};