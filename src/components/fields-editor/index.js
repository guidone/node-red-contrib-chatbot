import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { Button } from 'rsuite';

import FieldEditor from './field-editor';
import KeyTag from './key-tag';
import './style.scss';

const FieldsEditor = ({
  value = [],
  onChange = () => {},
  schema,
  labels = {}
}) => {
  const {
    addField = 'Add custom field',
    emptyFields = 'No custom fields',
    addAvailableFields = 'Add one of these available fields',
    availableFields = 'Available fields:',
    noPredefinedFields = 'No predefined fields'
  } = labels;
  const usedFields = (value || []).map(item => item.name);
  const addTag = keyTag => {
    onChange([
      ...value,
      { name: keyTag.key, type: keyTag.type, value: keyTag.defaultValue, cid: _.uniqueId('c')
    }]);
  };
  // TODO these can be evaluated once
  const availableKeyTag = (schema || []).filter(keyTag => !usedFields.includes(keyTag.key));
  const helps = (schema || []).reduce((acc, { key, description}) => ({ ...acc, [key]: description }), {});

  return (
    <div className="ui-fields-editor">
      <div className="fields-container">
        <div className="fields">
          {(value || []).map((field, idx) => (
            <FieldEditor
              field={field}
              key={field.id || field.cid}
              description={helps[field.name]}
              onChange={field => {
                const newFields = [...value];
                newFields[idx] = field;
                onChange(newFields);
              }}
              onRemove={() => {
                let newFields = [...value];
                newFields[idx] = null;
                onChange(_.compact(newFields));
              }}
            />
          ))}
        </div>
        {!_.isEmpty(value) && schema != null && (
          <div className="available-keys">
            <Fragment>
              <div className="available-fields">{availableFields}</div>
              {availableKeyTag.map(keyTag => (
                <KeyTag
                  keyTag={keyTag}
                  key={keyTag.key}
                  onClick={addTag}
                />
              ))}
              {availableKeyTag.length === 0 && (
                <div className="no-predefined-fields">{noPredefinedFields}</div>
              )}
            </Fragment>
          </div>
        )}
      </div>
      {_.isEmpty(value) && (
        <div className="empty">
          <div className="label">{emptyFields}</div>
          {schema != null && (
            <div className="schema">
              <Fragment>
                <div className="available-fields">{addAvailableFields}</div>
                {schema.map(keyTag => (
                  <KeyTag
                    keyTag={keyTag}
                    key={keyTag.key}
                    onClick={addTag}
                  />
                ))}
            </Fragment>
            </div>
          )}
        </div>
      )}
      <div>
        <Button onClick={() => {
          onChange([...value, { name: '', type: 'string', value: '', cid: _.uniqueId('c') }]);
        }}>{addField}</Button>
      </div>
    </div>
  );
};
FieldsEditor.propTypes = {
  value: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.oneOf(['string', 'boolean', 'date', 'number', 'tags']),
    value: PropTypes.any
  })),
  onChange: PropTypes.func,
  labels: PropTypes.shape({
    addField: PropTypes.string,
    emptyFields: PropTypes.string
  }),
  schema: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
    defaultValue: PropTypes.string,
    color: PropTypes.oneOf(['red','orange', 'yellow', 'green', 'cyan', 'blue', 'violet'])
  }))
};

export default FieldsEditor;
