import React from 'react';
import PropTypes from 'prop-types';

import './style.scss';

import FilterInput from './components/input';
import FilterUserAutocomplete from './components/user-autocomplete';

const TableFilters = ({
  filters,
  schema,
  disabled = false,
  width: generalWidth = 150,
  onChange = () => {}
}) => {
  return (
    <div className="ui-table-filters">
      {schema.map(({ name, label, control: Control, width, ...rest }) => {
        return (
          <div key={name} className="control" style={{ width: `${_.isNumber(width) ? width : generalWidth}px` }}>
            <Control
              defaultValue={filters[name]}
              disabled={disabled}
              placeholder={label}
              onChange={value => onChange({ ...filters, [name]: value === null ? undefined : value })}
              {...rest}
            />
          </div>
        );
      })}
    </div>
  );
};
TableFilters.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  width: PropTypes.number,
  filters: PropTypes.object,
  schema: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      // the label for the filter, it's likely to be used as placeholder
      label: PropTypes.string,
      // numeric keys will be parsed from query url
      type: PropTypes.oneOf(['string', 'number']),
      // the name of the filter (the key used for querying in GraphQL)
      name: PropTypes.string,
      // the react class, must honor defaultValue, placeholder, disabled and onChange
      control: PropTypes.any,
      // size of control
      width: PropTypes.number
    })
  ]))
};

export { TableFilters as default, FilterInput as Input, FilterUserAutocomplete as UserAutocomplete };