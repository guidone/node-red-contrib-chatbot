import React, { useState, useRef, Fragment, useCallback } from 'react';
import { Table, Icon, ButtonGroup, Button, FlexboxGrid } from 'rsuite';
import { useQuery, useMutation, useSubscription } from 'react-apollo';
import gql from 'graphql-tag';
import GoogleMapReact from 'google-map-react';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  useParams
} from 'react-router-dom';

const { Column, HeaderCell, Cell } = Table;

import { useCodePlug, Views } from 'code-plug';

import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import SmallTag from '../../../src/components/small-tag';
import CustomTable from '../../../src/components/table';
import { Input } from '../../../src/components/table-filters';
import confirm from '../../../src/components/confirm';
import useSettings from '../../../src/hooks/settings';

// import '../styles/admins.scss';

import PinPoint from '../views/pin-point';

const DEVICE = gql`
query ($id: Int!) {
  device(id: $id) {
    id,
    name,
    payload,
    createdAt,
    updatedAt,
    status,
    lat,
    lon,
    jsonSchema,
    snapshot,
    version,
    lastUpdate
  }
}
`;




const DEVICE_SUBSCRIPTION = gql`
  subscription onDeviceUpdated($id: Int!) {
    device: deviceUpdated(id: $id) {
      id,
      name,
      payload,
      createdAt,
      updatedAt,
      status,
      lat,
      lon,
      jsonSchema,
      version,
      lastUpdate,
      snapshot
    }
  }
`;



import EditDevice from '../../../src/components/edit-device';
import SmartDate from '../../../src/components/smart-date';

const DeviceHeader = ({ device }) => {
  const { items } = useCodePlug('device-header');


  return (
    <div className="device-header">
      <div className="header-group">
        <FlexboxGrid>
          <FlexboxGrid.Item colspan={6} className="header-label">
            ID
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={18}  className="header-value">
            {device.id} <SmallTag capitalize={false} color="#2685DB">v{device.version}</SmallTag>
          </FlexboxGrid.Item>
        </FlexboxGrid>
        <FlexboxGrid>
          <FlexboxGrid.Item colspan={6} className="header-label">
            Last update
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={18}  className="header-value">
            <SmartDate date={device.updatedAt} />
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </div>
      {items.map(({ view: View, props }) => {

        return (
          <div className="header-group">
            <FlexboxGrid key={props.id}>
              <FlexboxGrid.Item colspan={6} className="header-label">
                {props.label}
              </FlexboxGrid.Item>
              <FlexboxGrid.Item colspan={18}  className="header-value">
                <View {...props} device={device}/>
                {props.edit != null && (
                  <Fragment>
                    &nbsp;
                    <EditDevice
                      path={props.edit}
                      jsonSchema={device.jsonSchema}
                      value={device}
                      tooltip={props.tooltip}
                      title={props.tooltip}
                    />
                  </Fragment>
                )}
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
        );
      })}
    </div>
  );

}


const byString = function(o, s) {
  let str = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  str = str.replace(/^\./, '');           // strip a leading dot
  var a = str.split('.');
  for (var i = 0, n = a.length; i < n; ++i) {
      var k = a[i];
      if (k in o) {
          o = o[k];
      } else {
          return;
      }
  }
  return o;
}


const Channel = props => {
  const { items } = useCodePlug('device-header');

  return (
    <div className="device-channel">
      <Views
        region="device-channel"
        {...props}
      />

    </div>
  );

}


const findValue = (snapshot, name) => {

  let result;
  if (snapshot == null) {
    return null;
  }

  result = snapshot.analog.find(channel => channel.name === name);

  result = result != null ? result : snapshot.digital.find(channel => channel.name === name);

  return result;
}

const Device = () => {
  const [device, setDevice] = useState();
  const { id } = useParams();
  const { googleMapsKey } = useSettings();

  const channelPaths = [
    'digital',
    'analogInput',
    'analogOutput'
  ];

  const { data, error: error2 } = useSubscription(
    DEVICE_SUBSCRIPTION,
    {
      variables: { id: parseInt(id, 10) },
      onSubscriptionData: ({ subscriptionData: { data: { device } } }) => {
        console.log('device updated', device)
        setDevice(device);
      }
    }
  );


  const { loading, error } = useQuery(DEVICE, {
    fetchPolicy: 'network-only',
    variables: { id: parseInt(id, 10) },
    onCompleted: (data) => {
      console.log('data', data);
      setDevice(data.device);
    }
  });

  let breadcrumbs = [
    { title: 'Devices', url: '/devices' },
  ];
  if (!loading && device != null) {
    breadcrumbs = [...breadcrumbs, device.name];
  }

  if (device != null) {
    console.log('PAYLOAD', device.payload)
    console.log('SNAPSHOT', device.snapshot)
  }

  return (
    <PageContainer className="page-device">
      <Breadcrumbs pages={breadcrumbs}/>
      {device != null && (
        <Fragment>
          <div className="device-name">

            <h3 className="device-id">{device.id}</h3>
            &nbsp;
            <h3>/</h3>
            &nbsp;&nbsp;
            <h3>{device.name}</h3>
          </div>
          <FlexboxGrid>
            <FlexboxGrid.Item colspan={14}>

              <DeviceHeader device={device}/>

            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={10}>
              <div style={{ height: '200px '}}>
                <GoogleMapReact
                  bootstrapURLKeys={{ libraries: 'drawing', key: googleMapsKey }}
                  defaultCenter={{ lat: device.lat, lng: device.lon }}
                  defaultZoom={11}
                >
                  <PinPoint
                    key={device.id}
                    lat={device.lat}
                    lng={device.lon}
                    point={{}}
                    popover={device.name}
                    showPopover={false}
                  />
                </GoogleMapReact>
              </div>
            </FlexboxGrid.Item>
          </FlexboxGrid>
          <div className="channels">
            {_.flatten(channelPaths.map(channelPath => {


              const items = byString(device.payload, channelPath);
              if (_.isArray(items) && !_.isEmpty(items)) {
                return items.map((item, index) => (
                  <Channel
                    key={item.name}
                    channel={item}
                    path={`/${channelPath}[${index}]`}
                    device={device}
                    value={findValue(device.snapshot, item.name)}
                  />
                ))
              }
            }))}

          </div>
        </Fragment>
      )}
    </PageContainer>
  );
};

export default Device;
