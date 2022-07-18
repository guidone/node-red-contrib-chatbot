import React from 'react';
import { Form, FlexboxGrid, FormControl } from 'rsuite';
import PropTypes from 'prop-types';

import LanguagePicker from '../../language-picker';
import TextareaAutosize from '../../textarea-autosize';


const FormLabel = ({ value, onChange, disabled = false, disabledLanguages }) => (
  <Form
    formValue={value}
    onChange={onChange}
    autoComplete="off"
    fluid
  >
    <FlexboxGrid justify="space-between">
      <FlexboxGrid.Item colspan={19}>
        <FormControl
          name="text"
          accepter={TextareaAutosize}
          readOnly={disabled}
          style={{ width: '100%' }}
          minRows={1}
          maxRows={6}
        />
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={4}>
        <FormControl
          readOnly={disabled}
          name="language"
          hideLanguageLabel={true}
          cleanable={false}
          block
          disabledItemValues={disabledLanguages.filter(language => language !== value.language)}
          accepter={LanguagePicker}
        />
      </FlexboxGrid.Item>
    </FlexboxGrid>
  </Form>
);
FormLabel.propTypes = {
  value: PropTypes.shape({
    text: PropTypes.string,
    language: PropTypes.string
  }),
  onChange: PropTypes.func,
  disabled: PropTypes.bool
};

export default FormLabel;