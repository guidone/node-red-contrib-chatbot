import React, { useState, useRef } from 'react';
import { Form, FormGroup, ControlLabel, FormControl, Schema, ButtonToolbar, Button, HelpBlock, FlexboxGrid } from 'rsuite';

import confirm from '../../../src/components/confirm';

const { StringType } = Schema.Types;

const chatbotModel = Schema.Model({
  name: StringType()
    .isRequired('Name is required')
});

const ConfigurationForm = ({
  value,
  disabled = false,
  onSubmit = () => {}
}) => {
  const form = useRef(null);
  const [formValue, setFormValue] = useState(value);
  const [formError, setFormError] = useState();

  return (
    <div>
      <Form
        ref={form}
        checkTrigger="none"
        model={chatbotModel}
        formValue={formValue}
        formError={formError}
        onCheck={errors => setFormError(errors)}
        onChange={formValue => {
          setFormValue(formValue);
          setFormError(null);
        }}
        fluid autoComplete="off"
      >
        <FormGroup>
          <ControlLabel>Chatbot Id</ControlLabel>
          <FormControl
            disabled={true}
            name="chatbotId"
          />
          <HelpBlock>
            This is a unique identifier of the chatbot, it's defined in Node-RED configuration of the chatbot.
          </HelpBlock>
        </FormGroup>
        <FormGroup>
          <ControlLabel>Name</ControlLabel>
          <FormControl
            disabled={disabled}
            name="name"
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>Description</ControlLabel>
          <FormControl
            disabled={disabled}
            name="description"
            componentClass="textarea"
          />
        </FormGroup>
        <FormGroup style={{ marginTop: '40px' }}>
          <ButtonToolbar>
            <Button
              disabled={disabled}
              appearance="primary"
              onClick={() => {
                if (!form.current.check()) {
                  return;
                }
                onSubmit(formValue);
              }}>
              Save configuration
              </Button>
            <Button
              disabled={disabled}
              appearance="default"
              onClick={async () => {
                if (await confirm('Reset configuration?')) {
                  setFormValue(value);
                }
              }}
            >
              Reset
            </Button>
          </ButtonToolbar>
        </FormGroup>
      </Form>
    </div>
  );
};

export default ConfigurationForm;