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
import classNames from 'classnames';


//import './style.scss';
import useControl from '../helpers/use-control';
/*import FormContext from '../context';

import HelpBlock from './views/help-block';
import ErrorBlock from './views/error-block';
import ControlLabel from './views/control-label';
import NumberControl from './controls/number';
import DateControl from './controls/date';
import IntegerControl from './controls/integer';*/


// Reserved keywords for options in the json schema, these props are NOT passed with the spread operator
// to the component
const RESERVED_KEYWORDS = ['readPermission', 'writePermission', 'layout', 'collapsed', 'tooltip', 'readOnly'];

import Controller from '../controller';

import CollectionEditor from '../../collection-editor';

const ArrayControllerForm = ({ jsonSchema, order, value, onChange, disabled, currentPath }) => {
  return (
    <Controller
      jsonSchema={jsonSchema}
      value={value}
      readOnly={disabled}
      onChange={onChange}
      currentPath={`${currentPath}[${order}]`}
    />
  );
} ;

import matchedPathIndex from '../helpers/matched-path-index';

const ArrayController = props => {
  const { jsonSchema, level, value = [], onChange, readOnly = false, currentPath } = props;
  const { canWrite, canRead, log, permissions, filteredProps, path } = useControl(props);

  if (!canWrite) {
    log(`is readonly, available permissions %c"${permissions.join(',')}"`);
  }
  const { maxItems, minItems } = jsonSchema;

  // collect all indexes that can actuall
  const matchedIdx = matchedPathIndex(path, currentPath);

  console.log('array path', path)
  console.log('currentPath in array', currentPath)
  console.log('matched idx', matchedIdx)

  return (
    <Fragment>
      {!_.isEmpty(jsonSchema.title) && <div className={classNames('title', { [`title-${level}`]: true })}>{jsonSchema.title}</div>}
        <CollectionEditor
          {...filteredProps}
          value={value}
          form={ArrayControllerForm}
          disabled={readOnly || !canWrite}
          maxItems={_.isNumber(maxItems) ? maxItems : null}
          minItems={_.isNumber(minItems) ? minItems : null}
          onChange={onChange}
          jsonSchema={jsonSchema.items}
          sortable={false}
          currentPath={currentPath}
          hideControls={_.isArray(matchedIdx) && !_.isEmpty(matchedIdx)}
          indexes={matchedIdx}
        />
    </Fragment>
  );
};

export default ArrayController;