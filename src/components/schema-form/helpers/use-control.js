import { useContext } from 'react';
import _ from 'lodash';
import classNames from 'classnames';


import validate from './validate';
import FormContext from '../context';

const RESERVED_KEYWORDS = ['readPermission', 'writePermission', 'layout', 'collapsed', 'tooltip', 'readOnly', 'jsonSchema', 'currentPath'];

const useControl = props => {
  const { jsonSchema, error, readOnly = false } = props;
  const { permissions, debug, errors, path, disabled, hideTitles } = useContext(FormContext);
  const isAdmin = permissions.includes('*');
  const options = jsonSchema.options || {};
  const canWrite = isAdmin || _.isEmpty(options.writePermission) || (permissions || []).includes(options.writePermission);
  const canRead = isAdmin || _.isEmpty(options.readPermission) || (permissions || []).includes(options.readPermission);
  const contextError = (errors || []).find(error => error.id === jsonSchema['$id']);

  const log = str => {
    if (!debug) {
      return;
    }
    console.log(
      `%cFORM-SCHEMA%c id:${jsonSchema['$id']} %c${str}`,
      'background-color:#2258F8;color:#ffffff',
      'font-size:11px;color:#999999',
      'color: #000000',
      'color:#1B6BB3',
      'color: #000000'
    );
  };

  if (!canWrite) {
    log(`is readonly, available permissions %c"${(permissions || []).join(',')}"`);
  }

  return {
    canRead,
    canWrite: !readOnly && canWrite,
    disabled: !(!readOnly && !disabled && canWrite),
    className: classNames(options.className, { 'whit-error': error != null }),
    debug,
    hideTitles,
    path,
    error: error || contextError,
    validate: value => validate(value, jsonSchema),
    permissions: permissions || [],
    filteredProps: _.omit(props, RESERVED_KEYWORDS),
    RESERVED_KEYWORDS,
    log
   };
};

export default useControl;