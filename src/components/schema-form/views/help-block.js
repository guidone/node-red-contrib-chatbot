import React from 'react';
import _ from 'lodash';
import { HelpBlock as RawHelpBlock } from 'rsuite';

const HelpBlock = ({ jsonSchema = {} }) => {
  const { help } = jsonSchema.options || {};
  const examples = (jsonSchema.examples || []).filter(item => !_.isEmpty(item));
  if (!_.isEmpty(help)) {
    return <RawHelpBlock>{help}</RawHelpBlock>
  } else if (_.isArray(examples) && !_.isEmpty(examples)) {
    return <RawHelpBlock>Example: {examples.join(', ')}</RawHelpBlock>
  }
  return null;
};

export default HelpBlock;