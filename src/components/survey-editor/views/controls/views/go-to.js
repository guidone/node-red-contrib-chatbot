import React from 'react';
import { Form, FormControl, FormGroup, SelectPicker, HelpBlock, ControlLabel } from 'rsuite';
import _ from 'lodash';

import Tag from '../../tag';

const GoToForm = ({ formValue, questions, onChange = () => {}, exclude }) => {
  return (
    <div>
      <Form
        formDefaultValue={formValue}
        onChange={onChange}
        fluid
      >
      <FormGroup>
        <ControlLabel>Jump To Question</ControlLabel>
        <FormControl
          name="jump"
          accepter={SelectPicker}
          block={true}
          data={questions
            .filter(question => exclude == null || question.id !== exclude)
            .map(question => ({
              value: question.id,
              label: question.title,
              ...question
            }))
          }
          renderMenuItem={(label, item) => (<div><Tag>{item.tag}</Tag> {item.title}</div>)}
          renderValue={(label, item) => (<div><Tag>{item.tag}</Tag> {item.title}</div>)}
          onClean={() => onChange({ ...formValue, jump: null })}
        />
        <HelpBlock>
          Select the question to jump to if the user select this the answer <em>"{formValue.answer}"</em>
        </HelpBlock>
      </FormGroup>
      </Form>
    </div>
  );
};

export default GoToForm;