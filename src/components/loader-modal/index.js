import React from 'react';
import PropTypes from 'prop-types';
import { Loader } from 'rsuite';

const ModalLoader = ({ size = 'md' }) => {
  let minHeight = 300;
  let paddingTop = 100;
  switch(size) {
    case 'md':
      minHeight = 300;
      paddingTop = 80;
      break;
    case 'sm':
      minHeight = 80;
      paddingTop = 25;
      break;
  }
  return (
    <div style={{ minHeight: `${minHeight}px`, textAlign: 'center', paddingTop: `${paddingTop}px` }}>
      <Loader size="md" />
    </div>
  );
};
ModalLoader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md'])
};

export default ModalLoader;