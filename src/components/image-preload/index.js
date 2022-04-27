import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Placeholder, Icon } from 'rsuite';

import './style.scss';

function useImage(src) {
  const [status, setStatus] = useState({ loaded: false, failed: false })
  useEffect(() => {
    const mainImage = new Image();
    mainImage.onload = () => setStatus({ ...status, loaded: true });
    mainImage.src = src;
  }, [src]);
  return status;
}

const ImagePreload = ({ src, width = 200, height }) => {
  const { loaded, failed } = useImage(src);

  return (
    <div className="ui-image-preload">
      {!loaded && !failed && (
        <Placeholder.Graph active width={width} height={height != null ? height : width}>
          <Icon size="5x" icon="image"/>
        </Placeholder.Graph>
      )}
      {loaded && <img src={src} width={width}/>}
    </div>
);
};
ImagePreload.propTypes = {
  // the image url to be preloaded
  src: PropTypes.string,
  // the final width of the image and the placeholder
  width: PropTypes.number,
  // the height of the placeholder, one loaded will be the scaled height of the image
  height: PropTypes.number
};

export default ImagePreload;