import React from 'react';
import TextareaAuto from 'react-textarea-autosize';
import PropTypes from 'prop-types';

import './style.scss';

const TextareaAutosize = ({ onChange, ...rest }) => (
  <TextareaAuto
    className="ui-textarea-autosize rs-input"
    onChange={e => onChange(e.target.value)}
    {...rest}
  />
);
TextareaAutosize.propTypes = {
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  rows: PropTypes.number,
  minRows: PropTypes.number,
  maxRows: PropTypes.number
};

export default TextareaAutosize;