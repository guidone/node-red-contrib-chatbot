import React from 'react';
import GoogleMapReact from 'google-map-react';

import useSettings from '../../../src/hooks/settings';

import PinPoint from './pin-point';

const DevicesMap = ({ devices, height = 250 }) => {
  const { googleMapsKey } = useSettings();

  const handleMapLoaded = ({ maps, map }) => {
    const bounds = new maps.LatLngBounds();
    devices
      .filter(device => device.lat != null && device.lon != null)
      .forEach(device => bounds.extend(new maps.LatLng(device.lat, device.lon)));
    map.fitBounds(bounds);
  };

  let markers = devices
    .filter(device => device.lat != null && device.lon != null)
    .map(device => (
      <PinPoint
        key={device.id}
        lat={device.lat}
        lng={device.lon}
        point={{}}
        popover={device.name}
        showPopover={true}
      />
    ));

  const firstMarker = devices.find(device => device.lat != null && device.lon != null);
  let center = firstMarker != null ? { lat: firstMarker.lat, lng: firstMarker.lon } : { lat: 0, lng: 0 };

  return (
    <div className="ui-devices-map" style={{ height: `${height}px` }}>
      <GoogleMapReact
        bootstrapURLKeys={{ libraries: 'drawing', key: googleMapsKey }}
        onGoogleApiLoaded={handleMapLoaded}
        defaultCenter={center}
        defaultZoom={11}
      >
        {markers}
      </GoogleMapReact>
    </div>
  );
};

export default DevicesMap;