import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import classNames from 'classnames';

import InputLanguage from '../input-language';

import './style.scss';

const DictionaryItem = ({ item, active, onSelect }) => {
  return (
    <a 
      className={classNames('dictionary-item', { active })} 
      onClick={e => {
        e.preventDefault();
        onSelect(item);
      }}>
      <div className="name">{item.name}</div>
      {!_.isEmpty(item.description) && <div className="description">{item.description}</div>}
    </a>
  )
};
DictionaryItem.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string
  }),
  active: PropTypes.bool,
  onSelect: PropTypes.func
};

const Dictionary = ({ value = {}, onChange, schema = [] }) => {
  const [active, setActive] = useState(!_.isEmpty(schema) ? schema[0] : null);

  return (
    <div className="ui-dictionary">
      <div className="labels">
        {schema.map(item => (
          <DictionaryItem
            active={active != null && active.name === item.name} 
            key={item.name} 
            item={item}
            onSelect={item => setActive(item)}
          />
        ))}
      </div>
      <div className="translations">        
        {active != null && (
          <InputLanguage
            value={value != null && value[active.name]}
            labelAdd="Add translation"
            labelEmpty={`No translations for "${active.name}"`}
            onChange={translations => {
              const newValue = { ...value, [active.name]: translations };
              onChange(newValue);
            }}
          />
        )}
      </div>
    </div>
  );
};
Dictionary.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
  schema: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string
  }))
};

export default Dictionary;