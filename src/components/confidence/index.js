import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Slider } from 'rsuite';

import './style.scss';

const Confidence = ({
  value,
  onChange = () => {},
  ...rest
}) => {

  return (
    <div className="ui-confidence">
      <div className="slider">
      <Slider
        value={value}
        min={1}
        step={1}
        max={100}
        onChange={onChange}
        {...rest}
      />
      </div>
      <div className="value">
        {value != null && (
          <Fragment>
            <span className="number">{value}</span> <span className="unit">%</span>
          </Fragment>
        )}
      </div>
    </div>
  );
};
Confidence.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.number
};



export default Confidence;