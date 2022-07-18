import React from 'react';
import { SelectPicker } from 'rsuite';
import PropTypes from 'prop-types';

import Language from '../language';

import Languages from './languages';

const LanguagePicker = ({ 
  onChange = () => {},
  hideLanguageLabel = false, 
  ...props 
}) => {
  return (
    <SelectPicker 
      name="language" 
      cleanable={false}
      data={Languages.map(item => ({ value: item.code, label: item.name }))}
      onChange={language => onChange(language)}
      renderMenuItem={(label, item) => {
        return (
        <div>
          <Language>{item.value}</Language>
          <span style={{ display: 'inline-block', marginLeft: '5px' }}>{label}</span>
        </div>
        );
      }}
      renderValue={(value, item) => {
        return (
        <div>
          <Language>{value}</Language>
          {!hideLanguageLabel && <span style={{ display: 'inline-block', marginLeft: '5px' }}>{item.label}</span>}
        </div>
        );
      }}
      {...props} 
    />
  );
};
LanguagePicker.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
  hideLanguageLabel: PropTypes.bool
};

export default LanguagePicker;