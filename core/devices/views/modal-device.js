import React, { useState, Fragment, useRef } from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  Form,
  FormGroup,
  ControlLabel,
  FormControl,
  FlexboxGrid,
  SelectPicker,
  HelpBlock,
  Nav,
  InputNumber
} from 'rsuite';



import ShowError from '../../../src/components/show-error';

import JSONEditor from '../../../src/components/json-editor';
import { Views } from 'code-plug';
import useCanCloseModal from '../../../src/hooks/modal-can-close';
import useCurrentUser from '../../../src/hooks/current-user';





const isNamespace = (tabNamespace, namespace) => {
  return _.isEmpty(tabNamespace)
    || (_.isString(tabNamespace) && tabNamespace === namespace)
    || (_.isArray(tabNamespace) && tabNamespace.includes(namespace));
};

const ModalDevice = ({
  value: device,
  onCancel = () => {},
  onSubmit = () => {},
  onChange = () => {},

  disabled = false,
  error
}) => {
  const { can } = useCurrentUser();
  const { isChanged, setIsChanged, handleCancel } = useCanCloseModal({ onCancel });
  const [formValue, setFormValue] = useState(device);
  const [formError, setFormError] = useState(null);
  const [jsonSchema, setJsonSchema] = useState(
    !_.isEmpty(device.jsonSchema) ? JSON.stringify(device.jsonSchema, null, 2) : ''
  );
  const [tab, setTab] = useState('main');

  const form = useRef(null);




  return (
      <div>
        {error != null && <ShowError error={error}/>}
        <Nav
          appearance="tabs"
          active={tab}
          style={{ marginBottom: '15px' }}
          onSelect={tab => {
            // tab is switched to manual edit of payload, make sure the current payload field is serialized
            // in serialized payload in order to show the updated one
            if (tab === 'device-payload') {
              setJsonValue({
                json: !_.isEmpty(formValue.payload) ? JSON.stringify(formValue.payload, null, 2) : ''
              });
            }
            setTab(tab);
          }}
          activeKey={tab}
        >
          <Nav.Item eventKey="main">Device</Nav.Item>
          <Views region="modal-tabs">
            {(View, { label, id, permission }) => {
              if ((_.isEmpty(permission) || can(permission))) {
                return (
                  <Nav.Item key={id} active={id === tab} eventKey={id} onSelect={() => setTab(id)}>{label}</Nav.Item>
                );
              }
            }}
          </Views>
          <Nav.Item eventKey="device-schema">Schema</Nav.Item>
          <Nav.Item eventKey="device-snapshot">Snapshot</Nav.Item>
          <Nav.Item eventKey="device-payload">Payload</Nav.Item>
        </Nav>
        <Form
          ref={form}
          checkTrigger="none"
          formValue={formValue}
          formError={formError}
          onChange={formValue => {
            setIsChanged(true);
            setFormValue(formValue);
            setFormError(null);
            onChange(formValue);
          }}
          onCheck={errors => {
            setFormError(errors);
            setTab('main');
          }}
          fluid autoComplete="off"
        >
          {tab === 'main' && (
            <Fragment>
              <FormGroup>
                <ControlLabel>Title</ControlLabel>
                <FormControl name="name"/>
              </FormGroup>
              <FlexboxGrid justify="space-between" style={{ marginBottom: '24px' }}>
                <FlexboxGrid.Item colspan={11}>
                  <FormGroup>
                    <ControlLabel>Status</ControlLabel>
                    <FormControl name="status"/>
                  </FormGroup>
                </FlexboxGrid.Item>
                <FlexboxGrid.Item colspan={11}>
                  <FormGroup>
                    <ControlLabel>Version</ControlLabel>
                    <FormControl name="version"/>
                  </FormGroup>
                </FlexboxGrid.Item>
              </FlexboxGrid>
              <FlexboxGrid justify="space-between">
                <FlexboxGrid.Item colspan={11}>
                  <FormGroup>
                    <ControlLabel>Latitude</ControlLabel>
                    <FormControl name="lat" accepter={InputNumber}/>
                  </FormGroup>
                </FlexboxGrid.Item>
                <FlexboxGrid.Item colspan={11}>
                  <FormGroup>
                    <ControlLabel>Longitude</ControlLabel>
                    <FormControl name="lon" accepter={InputNumber}/>
                  </FormGroup>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </Fragment>
          )}
          <Views region="device-tabs">
            {(View, { id }) => {
              if (id === tab) {
                return (
                  <View
                    key={id}
                    formValue={formValue.payload}
                    onChange={payload => {
                      setIsChanged(true);
                      setFormValue({ ...formValue, payload });
                    }}
                  />
                );
              }
              return <div key={id}/>;
            }}
          </Views>
          {tab === 'device-schema' && (
            <JSONEditor
              readOnly={disabled}
              value={jsonSchema}
              height="400px"
              onChange={json => {
                if (!_.isEmpty(json)) {
                  let jsonSchema;
                  setJsonSchema(json);
                  try {
                    jsonSchema = JSON.parse(json);
                  } catch(e) {
                    // error do nothing
                    return;
                  }
                  console.log('---', jsonSchema)
                  setIsChanged(true);
                  setFormValue({ ...formValue, jsonSchema });
                  onChange({ ...formValue, jsonSchema });
                }
              }}
            />
        )}
        </Form>
        {tab === 'device-snapshot' && (
          <JSONEditor
            readOnly={true}
            value={JSON.stringify(device.snapshot, null, 2)}
            height="400px"
            style={{ marginBottom: '20px' }}
          />
        )}
        {tab === 'device-payload' && (
          <JSONEditor
            readOnly={true}
            value={JSON.stringify(device.payload, null, 2)}
            height="400px"
            style={{ marginBottom: '20px' }}
          />
        )}
      </div>
  );
};
ModalDevice.propTypes = {
};

export default ModalDevice;
