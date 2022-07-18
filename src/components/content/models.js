import { Schema } from 'rsuite';

const { StringType, ArrayType, ObjectType } = Schema.Types;

const category = Schema.Model({
  name: StringType()
    .isRequired('Name is required')
});

const content = Schema.Model({
  title: StringType()
    .isRequired('Title is required'),
  fields: ArrayType().of(ObjectType().shape({
    name: StringType()
      .addRule(
        value => value.match(/^[A-Za-z0-9-_ ]*$/) != null,
        'Invalid field name, just letter, numbers or ("-", "_")'
      )
      .isRequired('Name of field is required')
  }))
});

export { category, content };