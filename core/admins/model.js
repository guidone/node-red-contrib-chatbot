import { Schema } from 'rsuite';

const { StringType } = Schema.Types;

const admin = Schema.Model({
  username: StringType()
    .isRequired('Username is required'),
  first_name: StringType()
    .isRequired('First name is required'),
  last_name: StringType()
    .isRequired('Last name is required'),
  email: StringType()
    .isRequired('Email is required')
    .isEmail('Email is not valid')
});

export default admin ;