import React from 'react';
import { Input } from 'rsuite';


const FilterInput = ({ onChange, ...rest }) => (
  <Input
    {...rest}
    onKeyUp={e => {
      if (e.keyCode === 13) {
        onChange(!_.isEmpty(e.target.value) ? e.target.value : undefined);
      }
    }}
  />
);

export default FilterInput;