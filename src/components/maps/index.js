import React from 'react';
import GoogleMapReact from 'google-map-react';

import useSettings from '../../../src/hooks/settings';

const Maps = ({ children, height = 300, ...rest }) => {
  const { googleMapsKey } = useSettings();

  return (
    <div className="ui-devices-map" style={{ height: `${height}px` }}>
      <GoogleMapReact
        bootstrapURLKeys={{ libraries: 'drawing', key: googleMapsKey }}
        {...rest}
      >
        {children}
      </GoogleMapReact>
    </div>
  );
};

export default Maps;
