import React, { Fragment, useContext, useState, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
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
//import classNames from 'classnames';


//import './style.scss';
import useControl from './helpers/use-control';
//import FormContext from './context';

import HelpBlock from './views/help-block';
import ErrorBlock from './views/error-block';
import ControlLabel from './views/control-label';
import NumberControl from './controls/number';
import DateControl from './controls/date';
import IntegerControl from './controls/integer';
import ObjectControl from './controls/object';
import ArrayControl from './controls/array';


// Reserved keywords for options in the json schema, these props are NOT passed with the spread operator
// to the component
const RESERVED_KEYWORDS = ['readPermission', 'writePermission', 'layout', 'collapsed', 'tooltip', 'readOnly'];



const StringController = props => {
  const { jsonSchema, required = false } = props;
  const { error, filteredProps, className, disabled } = useControl(props);
  const { tooltip } = jsonSchema.options || {};



  return (
    <FormGroup>
      {!_.isEmpty(jsonSchema.title) && <ControlLabel required={required} tooltip={tooltip}>{jsonSchema.title}</ControlLabel>}
      <Input
        {...filteredProps}
        className={className}
        disabled={disabled}
      />
      <HelpBlock jsonSchema={jsonSchema}/>
      <ErrorBlock error={error}/>
    </FormGroup>
  );
}

const SelectController = props => {
  const { jsonSchema, required = false, searchable = false, parseNumber = false, onChange = () => {}, value } = props;
  const { error, className, disabled, filteredProps } = useControl(props);

  return (
    <FormGroup>
      {!_.isEmpty(jsonSchema.title) && <ControlLabel required={required}>{jsonSchema.title}</ControlLabel>}
      <SelectPicker
        {...filteredProps}
        className={className}
        disabled={disabled}
        data={jsonSchema.enum.map(value => ({ value, label: String(value) }))}
        block
        searchable={searchable}
        cleanable={true}
      />
      <HelpBlock jsonSchema={jsonSchema}/>
      <ErrorBlock error={error}/>
    </FormGroup>
  );
};

const BooleanController = ({ jsonSchema, required = false, value, ...props }) => {
  return (
    <FormGroup>
      {!_.isEmpty(jsonSchema.title) && <ControlLabel required={required}>{jsonSchema.title}</ControlLabel>}
      <Toggle checked={value === true} {...props}/>
    </FormGroup>
  );
};





const Controller = ({ value, field, jsonSchema, level = 0, onChange, currentPath = '', ...props }) => {
  const { path } = useControl({ jsonSchema });
  const common = {
    field,
    jsonSchema,
    value: value,
    level,
    currentPath,
    onChange: newValue => {
      onChange(newValue);
    },
    ...(_.isObject(jsonSchema.options) ? _.omit(jsonSchema.options, RESERVED_KEYWORDS) : {}),
    currentPath,
    ...props
  };

  // console.log('CONTROLLER', currentPath, path )



  if (['string'].includes(jsonSchema.type) && _.isArray(jsonSchema.enum) && !_.isEmpty(jsonSchema.enum)) {
    return <SelectController {...common}/>;
  } else if (['integer', 'number'].includes(jsonSchema.type) && _.isArray(jsonSchema.enum) && !_.isEmpty(jsonSchema.enum)) {
    return <SelectController {...common} parseNumber />;
  } else if (jsonSchema.type === 'number') {
    return (<NumberControl {...common}/>)
  }else if (jsonSchema.type === 'boolean') {
    return (<BooleanController {...common}/>)
  } else if (jsonSchema.type === 'string' && ['date-time', 'time', 'date'].includes(jsonSchema.format)) {
    return (<DateControl {...common}/>)
  } else if (jsonSchema.type === 'string') {
    return (<StringController {...common}/>)
  } else if (jsonSchema.type === 'integer') {
    return (<IntegerControl {...common}/>)
  } else if (jsonSchema.type === 'object') {
    return (<ObjectControl {...common}/>)
  } else if (jsonSchema.type === 'array') {
    return (<ArrayControl {...common}/>)
  }

  return (
    <div>Control type {jsonSchema.type} doesn't exist</div>
  );
}

export default Controller;