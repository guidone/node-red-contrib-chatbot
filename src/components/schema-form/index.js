import React, { Fragment, useContext, useState, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  FormGroup,
  ControlLabel as RawControlLabel,
  HelpBlock as RawHelpBlock,
  Input,
  InputNumber,
  SelectPicker,
  Toggle,
  PanelGroup,
  Panel,
  Icon
 } from 'rsuite';
import classNames from 'classnames';


import './style.scss';
import useControl from './helpers/use-control';
import FormContext from './context';
import validate from './helpers/validate';

import HelpBlock from './views/help-block';
import ErrorBlock from './views/error-block';
import ControlLabel from './views/control-label';
import NumberControl from './controls/number';
import DateControl from './controls/date';
import IntegerControl from './controls/integer';


const setDefaults = (value, jsonSchema) => {
  if (jsonSchema == null) {
    return {};
  }

  if (jsonSchema.type === 'object') {
    if (value == null) {
      value = {};
    }
    Object.entries(jsonSchema.properties)
      .filter(([field, schema]) => value[field] == null)
      .forEach(([field, schema]) => {
        value[field] = setDefaults(null, schema);
      })
    return value;
  } else if (jsonSchema.type === 'array') {
    if (value == null) {
      value = [];
    }
    return value;
  } else {
    if (value == null && jsonSchema.default != null) {
      value = jsonSchema.default;
    }
    return value;
  }
}


import Controller from './controller';



const SchemaForm = ({
  jsonSchema,
  value,
  onChange = () => {},
  permissions = [],
  debug = true,
  disabled = false,
  path,
  hideTitles = false,
  validateAsType = false,
  errors
}) => {
  if (jsonSchema == null) {
    console.warn('An empty schema was passed to SchemaForm');
    return <Fragment />
  }

  const [formValue, setFormValue] = useState(setDefaults(value, jsonSchema));
  const { validate } = useControl({ jsonSchema });

  return (
    <div className="ui-schema-form">
      <FormContext.Provider value={{
        permissions,
        debug,
        disabled,
        hideTitles,
        errors: validateAsType ? validate(formValue) : errors,
        path: _.isArray(path) ? path : [path]
      }}>
        <Controller
          jsonSchema={jsonSchema}
          value={formValue}
          onChange={value => {
            setFormValue(value);
            onChange(value);
          }}/>
      </FormContext.Provider>
    </div>
  );
};
SchemaForm.propTypes = {
  jsonSchema: PropTypes.object,
  value: PropTypes.object,
  onChange: PropTypes.func,
  // user permissions, show all fields without permissions and those with al least one permission
  // in this list
  permissions: PropTypes.arrayOf(PropTypes.string),
  // show debug information
  debug: PropTypes.bool,
  disabled: PropTypes.bool,
  // only show portions of the form (i.e. /digital[3])
  path: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  // hide titles of the form
  hideTitles: PropTypes.bool,
  // validate form as user is typing
  validateAsType: PropTypes.bool
};


export { SchemaForm as default, validate };