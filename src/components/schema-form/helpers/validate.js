import _ from 'lodash';

import isValidDate from '../../../helpers/is-valid-date';

/*const useValidation = (path, schema) => {

  let validation = createBlankValidation(path, jsonSchema);

  return {
    validation,
    namme
  }

}*/
import matchPath from './match-path';

const append = (validation, msg) => ({
  ...validation,
  errors: [...validation.errors, msg]
});
const hasErrors = validation => {
  if (_.isArray(validation)) {
    return !_.isEmpty(validation);
  } else if (_.isObject(validation)) {
    return !_.isEmpty(validation.errors);
  }
  return false;
};
const createBlankValidation = (path, jsonSchema) => ({
  path: _.isEmpty(path) ? '/' : path,
  id: jsonSchema['$id'],
  errors: []
});

const validateArray = (value, path, jsonSchema) => {
  const { maxItems , minItems, title } = jsonSchema || [];
  let validation = createBlankValidation(path, jsonSchema);
  const fieldName = !_.isEmpty(title) ? `"${title}"` : 'array';
  let validations = [];

  if (!_.isObject(value)) {
    return [append(validation, { error: `${fieldName} is not an array` })];
  }

  if (_.isNumber(minItems) && value.length < minItems) {
    validation = append(validation, { error: `${fieldName} length is smaller than ${minItems}` });
  }

  if (_.isNumber(maxItems) && value.length > maxItems) {
    validation = append(validation, { error: `${fieldName}  length is greater than ${maxItems}` });
  }
  // validate items of array
  value.forEach((item, idx) => {
    // only check if not null
    if (item != null) {
      // check validation of sub array items
      const subValidation = validate(item, `${path}[${idx}]`, jsonSchema.items);
      if (hasErrors(subValidation)) {
        validations = [...validations, ...subValidation];
      }
    }
  });

  // add local validation
  if (hasErrors(validation)) {
    validations = [validation, ...validations];
  }

  return !_.isEmpty(validations) ? validations : null;
};


const validateObject = (value, path, jsonSchema) => {

  let { required, title, dependencies, properties } = jsonSchema || [];
  let validation = createBlankValidation(path, jsonSchema);
  const fieldName = !_.isEmpty(title) ? `"${title}"` : 'object';
  let validations = [];

  if (!_.isObject(value)) {
    return [append(validation, { error: `${fieldName} is not an object` })];
  }

  // add all required field from dependencies
  Object.entries(jsonSchema.dependencies || {})
    .forEach(([field, fields]) => {
      // if the key of the dependencies is present
      if (value[field] != null && value[field] !== '') {
        // if it's an array, just add the fields to the requireds array, if it's an object
        // then merge properties and requireds array (that allows some fields to appear in some conditions)
        if (_.isArray(fields)) {
          required = _.uniq([...required, ...fields]);
        } else {
          required = _.uniq([...required, ...fields.required]);
          properties = { ...properties, ...fields.properties };
        }
      }
    });

  // check required values
  (required || [])
    .forEach(field => {
      if (_.isEmpty(value[field]) && !_.isNumber(value[field])) {
        // check local validation of the object
        const fieldName = properties[field] != null && !_.isEmpty(properties[field].title) ?
          properties[field].title : field;
        validation = append(validation, {
          id: properties[field] != null ? properties[field]['$id'] : null,
          path: `${path}/${field}`,
          error: `"${fieldName}" is required`
        });
      }
    });

  // check sub properties
  Object.entries(properties)
    .forEach(([field, schema]) => {
      // only check if not null
      if (value[field] != null) {
        // check validation of sub objects
        const subValidation = validate(value[field], `${path}/${field}`, schema);
        //console.log('sub validations', subValidation, hasErrors(subValidation))
        if (hasErrors(subValidation)) {
          validations = [...validations, ...subValidation];
        }
      }
    });

  // add local validation
  if (hasErrors(validation)) {
    validations = [validation, ...validations];
  }

  return !_.isEmpty(validations) ? validations : null;
}

const validateString = (value, path, jsonSchema) => {
  const { minLength, maxLength, title, format } = jsonSchema || {};
  let validation = createBlankValidation(path, jsonSchema);
  const fieldName = !_.isEmpty(title) ? `"${title}"` : 'string';

  if (!_.isString(value)) {
    return [append(validation, { error: `${fieldName} is not a string` })];
  }

  if (['date-time', 'date', 'time'].includes(format)) {
    const date = new Date(value);
    if (!isValidDate(date)) {
      validation = append(validation, { error: `${fieldName} is not a valid date/time` });
    }
  } else {

    if (_.isNumber(minLength) && value.length < minLength) {
      validation = append(validation, { error: `${fieldName} is shorter than ${minLength} chars` });
    }
    if (_.isNumber(maxLength) && value.length > maxLength) {
      validation = append(validation, { error: `${fieldName} is longer than ${maxLength} chars` });
    }
  }

  return hasErrors(validation) ? [validation] : null;
};

const validateNumber = (value, path, jsonSchema) => {
  const { minimum , exclusiveMinimum, maximum, exclusiveMaximum, title } = jsonSchema || {};
  let validation = createBlankValidation(path, jsonSchema);
  const fieldName = !_.isEmpty(title) ? `"${title}"` : 'number';

  if (!_.isNumber(value)) {
    return [append(validation, { error: `${fieldName} is not an integer` })];
  }
  if (_.isNumber(minimum) && value <= minimum) {
    validation = append(validation, { error: `${fieldName} is greater or equal than ${minimum}` });
  }
  if (_.isNumber(exclusiveMinimum) && value < exclusiveMinimum) {
    validation = append(validation, { error: `${fieldName} is not greater than ${exclusiveMinimum}` });
  }
  if (_.isNumber(maximum) && value >= maximum) {
    validation = append(validation, { error: `${fieldName} is not smallar or equal than ${maximum}` });
  }
  if (_.isNumber(exclusiveMaximum) && value > exclusiveMaximum) {
    validation = append(validation, { error: `${fieldName} is not smaller than ${exclusiveMaximum}` });
  }

  return hasErrors(validation) ? [validation] : null;
};


const validators = {
  object: validateObject,
  string: validateString,
  integer: validateNumber,
  number: validateNumber,
  array: validateArray
};

const validate = (value, path = '', jsonSchema) => {

  let errors = null;
  const { type } = jsonSchema || {};

  if (_.isFunction(validators[type])) {
    errors = validators[type](value, path, jsonSchema);
  } else {
    console.log(`Warning, don't know how to validate "${type}"`);
  }
  return errors;
};


/**
 * @method validate
 * Validate a json object against a json schema, uses path to validate only some parts of the schema in case the object
 * is split between different forms
 * @param {Object} value
 * @param {Object} jsonSchema
 * @param {String/Array} path String or array of string with path of elements
 * @return {Array}
 */
export default (value, jsonSchema, path) => {
  return validate(value, '/', jsonSchema)
    .map(error => ({
      ...error,
      path: error.path.replace('//', '/')
    }))
    .filter(error => matchPath(error.path, _.isArray(path) ? path : [path]));
};