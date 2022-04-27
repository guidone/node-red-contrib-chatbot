import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import {
  Form,
  FormControl,
  FlexboxGrid,
  IconButton,
  Icon,
  SelectPicker,
  Whisper,
  Tooltip,
  InputGroup,
  Input,
  TagPicker
} from 'rsuite';

import './style.scss';

import FieldTypes from './field-types';
import BooleanField from './fields/boolean';
import DateField from './fields/date';
import NumberField from './fields/number';

const InputWithInfo = ({ description, ...rest }) => {
  return (
    <InputGroup className="input-with-info" inside>
      <Input {...rest} />
      {!_.isEmpty(description) && (
        <InputGroup.Addon>
          <Whisper trigger="hover" speaker={<Tooltip placement="top">{description}</Tooltip>}>
            <Icon icon="help-o"/>
          </Whisper>
        </InputGroup.Addon>
      )}
    </InputGroup>
  );
};



const FieldEditor = ({
  field,
  onChange = () => {},
  onRemove = () => {},
  description
}) => {

  let accepter;
  let additionalProps = {};
  if (field.type === 'boolean') {
    accepter = BooleanField;
  } else if (field.type === 'date') {
    accepter = DateField;
  } else if (field.type === 'number') {
    accepter = NumberField;
  } else if (field.type === 'tags') {
    accepter = TagPicker;
    additionalProps = {
      data: !_.isArray(field.value) ?
        [] : field.value.map(item => ({ value: item, label: item })),
      creatable: true,
      searchable: true,
      preventOverflow: false,
      block: true
    };
  }

  return (
    <div className="field-editor">
      <Form
        layout="inline"
        formValue={field}
        onChange={field => onChange(field)}
          autoComplete="off"
        >
        <FlexboxGrid justify="space-between" style={{ marginBottom: '10px', marginRight: '0px' }}>
          <FlexboxGrid.Item colspan={7}>
            <FormControl
              name="name"
              placeholder="Name"
              accepter={InputWithInfo}
              description={description}
            />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={5}>
            <FormControl
              name="type"
              placeholder="Type"
              accepter={SelectPicker}
              data={FieldTypes}
              block
              searchable={false}
              cleanable={false}
            />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={9}>
            <FormControl
              name="value"
              placeholder="value"
              accepter={accepter}
              {...additionalProps}
            />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={1} align="right">
            <IconButton
              onClick={() => onRemove()}
              icon={<Icon icon="close" />}
              size="md"
            />
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Form>
    </div>
  );
};
FieldEditor.propTypes = {
  field: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.oneOf(['string', 'boolean', 'date', 'number', 'tags']),
    value: PropTypes.any
  }),
  onChange: PropTypes.func,
  onRemove: PropTypes.func,
  description: PropTypes.string
};

export default React.memo(FieldEditor);