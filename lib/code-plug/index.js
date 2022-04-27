import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

// todo generate id aut
// todo add prop-types libyarn d

import CodePlug from './components/code-plug';
import Views from './components/views';
import Plugin from './components/plugin';
import Items from './components/items';
import Consumer from './components/consumer';
import plug from './components/plug';
import withCodePlug from './components/with-code-plug';

import PlugItUserPermissions from './hooks/user-permission';


import PlugItContext from './context';

const rule = (value, predicate) => {
  //console.log('----', value, predicate)
  if (_.isString(predicate) || _.isNumber(predicate)) {
    return value === predicate || predicate === '*';
  } else if (_.isObject(predicate) && Object.keys(predicate).length > 1) {
    throw `Multiple keys not allowed in predicate ${JSON.stringify(predicate)}`
  } else if (_.isObject(predicate) && Object.keys(predicate).length === 1) {
    const operator = Object.keys(predicate)[0];
    const object = predicate[operator];
    //console.log('operator:object', operator, object)
    if (operator === '$in') {
      if (!_.isArray(object)) {
        throw `The $in operators requires an array of values`;
      }
      // check if value is included in the predicate of the predicate includes the wildcard
      return object.includes(value) || object.includes('*');
    } else if (operator === '$intersect') {
      return object.includes('*') || _.intersection(object, _.isArray(value) ? value : [value]).length !== 0;
    }
  }
  throw `Unable to test condition for: ${JSON.stringify(predicate)}`
}


const match = (props, query) => {
  if (_.isEmpty(query)) {
    return true;
  }
  return Object.keys(query)
    .every(key => _.isEmpty(props[key]) || rule(props[key], query[key]));
}


const useCodePlug = (region, query = null) => {
  const { codePlug } = useContext(PlugItContext);
  const items = codePlug
    .getItems(region)
    .filter(item => match(item.props, query));



  return {
    codePlug,
    items,
    props: items.map(item => item.props)
  };
}


export { CodePlug, Consumer, Views, Items, Plugin, PlugItUserPermissions, plug, withCodePlug, useCodePlug };
