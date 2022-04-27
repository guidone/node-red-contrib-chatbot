import React from 'react';
import PropTypes from 'prop-types';

import CollectionEditor from '../collection-editor';

import FormLabel from './views/form-label';
import './style.scss';

// TODO check if language is not defined

const InputLanguage = ({
  value = {},
  disabled = false,
  labelAdd = 'Add label',
  labelEmpty,
  onChange = () => {},
  style
}) => {
  const languages = Object.keys(value);
  const current = languages.map(key => ({ language: key, text: value[key], id: key }))
  return (
    <div className="ui-input-language" style={style}>
      <CollectionEditor
        value={current}
        disabled={disabled}
        form={FormLabel}
        sortable={false}
        labelAdd={labelAdd}
        disabledLanguages={languages}
        labelEmpty={labelEmpty}
        disableAdd={languages.includes('new')}
        onChange={value => {
          const newValue = {};
          value.forEach(item => newValue[item.language || 'new'] = item.text);
          onChange(newValue);
        }}
      />
    </div>
  );
};
InputLanguage.propTypes = {
  value: PropTypes.object,
  style: PropTypes.object,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  labelAdd: PropTypes.string,
  labelEmpty: PropTypes.string
};

export default InputLanguage;