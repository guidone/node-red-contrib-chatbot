import React, { useState, useRef } from 'react';
import { Table, Icon, ButtonGroup, Button } from 'rsuite';
import gql from 'graphql-tag';
import { Link } from 'react-router-dom';
import { useMutation } from 'react-apollo';

const { Column, HeaderCell, Cell } = Table;

import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import SmartDate from '../../../src/components/smart-date';
import CustomTable from '../../../src/components/table';
import { useModal } from '../../../src/components/modal';
import confirm from '../../../src/components/confirm';
import ShowError from '../../../src/components/show-error';

import ModalDevice from '../views/modal-device';
import DevicesMap from '../views/devices-map';


const DEVICES = gql`
query ($limit: Int, $offset: Int, $order: String) {
  counters {
    rows: devices {
      count
    }
  }
  rows: devices(limit: $limit, offset: $offset, order: $order) {
    id,
    name,
    payload,
    createdAt,
    updatedAt,
    status,
    snapshot,
    jsonSchema,
    version,
    lat,
    lon
  }
}
`;

const EDIT_DEVICE = gql`
mutation($id: Int!, $device: NewDevice!) {
  editDevice(id: $id, device: $device) {
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

const CREATE_DEVICE = gql`
mutation($device: NewDevice!) {
  createDevice(device: $device) {
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

const DELETE_DEVICE = gql`
mutation($id: Int!) {
  deleteDevice(id: $id) {
    id
  }
}`;



const updateDevices = (devices, device) => {
  if (device.id != null) {
    return devices.map(d => d.id === device.id ? device : d);
  } else return [...devices, device];
};



const Devices = () => {
  const [devices, setDevices] = useState();
  const table = useRef();

  const { open, close, disable } = useModal({
    view: ModalDevice,
    labelSubmit: 'Save device',
    title: device => device != null && device.id != null ?
      <span>Edit device <em>"{device.name}"</em></span> : <span>Create new device</span>
  });
  const [editDevice, { error: editError }] = useMutation(EDIT_DEVICE);
  const [createDevice, { error: createError }] = useMutation(CREATE_DEVICE);
  const [deleteDevice, { loading: deleteLoading, error: deleteError }] = useMutation(DELETE_DEVICE);

  //const [ admin, setAdmin ] = useState(null);
  //const { saving, error,  deleteAdmin, editAdmin, createAdmin } = useAdmins();

  const disabled = deleteLoading;
  const error = editError || createError || deleteError;


  return (
    <PageContainer className="page-devices">
      <Breadcrumbs pages={['Devices']}/>
      {error != null && <ShowError error={error}/>}
      {devices != null && (
        <DevicesMap devices={devices} />
      )}
      <div className="buttons">
        <Button
          appearance="primary"
          disabled={disabled}
          onClick={async () => {
            const newDevice = await open({ });
            if (newDevice != null) {
              disable();
              await createDevice({ variables: {
                device: _.omit(newDevice, ['id', '__typename'])
              }});
              setDevices(updateDevices(devices, newDevice));
              table.current.refetch();
            }
            close();
          }}
        >
          Add Device
        </Button>
      </div>
      <CustomTable
        ref={table}
        query={DEVICES}
        height={600}
        initialSortField="createdAt"
        initialSortDirection="desc"
        onData={devices => {
          setDevices(devices);
        }}
        autoHeight
      >
        <Column width={60} align="center">
          <HeaderCell>Id</HeaderCell>
          <Cell dataKey="id" />
        </Column>

        <Column width={140} resizable>
          <HeaderCell>Last Update</HeaderCell>
          <Cell>
            {({ createdAt }) => <SmartDate date={createdAt} />}
          </Cell>
        </Column>

        <Column flexGrow={1}>
          <HeaderCell>Name</HeaderCell>
          <Cell dataKey="name">
            {({ name, id }) => <Link to={`/devices/${id}`}>{name}</Link>}
          </Cell>
        </Column>

        <Column width={200} resizable>
          <HeaderCell>Status</HeaderCell>
          <Cell dataKey="status"/>
        </Column>

        <Column width={80}>
          <HeaderCell>Action</HeaderCell>
          <Cell>
            {device => (
              <ButtonGroup>
                <Button
                  size="xs"
                  onClick={async () => {
                    const modifiedDevice = await open(device);
                    console.log('modifiedDevice', modifiedDevice)
                    if (modifiedDevice != null) {
                      disable();
                      await editDevice({ variables: {
                        id: device.id,
                        device: _.omit(modifiedDevice, ['id', '__typename'])
                      }});
                      setDevices(updateDevices(devices, modifiedDevice));
                    }
                    close();
                  }}
                >
                  <Icon icon="edit2" />
                </Button>
                <Button
                  size="xs"
                  onClick={async () => {
                    if (await confirm(
                      <div>Delete device <em>"{device.name}" ?</em></div>,
                      { okLabel: 'Yes, delete' }
                    )) {
                      await deleteDevice({ variables: { id: device.id }});
                      table.current.refetch();
                    }
                  }}
                >
                  <Icon icon="trash" />
                </Button>
            </ButtonGroup>
            )}
          </Cell>
        </Column>
      </CustomTable>
    </PageContainer>
  );
};

export default Devices;
