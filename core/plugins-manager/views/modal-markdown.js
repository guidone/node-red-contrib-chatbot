import React from 'react';
import PropTypes from 'prop-types';

import { MarkdownViewer } from '../../../src/components';

const ModalMarkdown = ({ value = {} }) => (
  <MarkdownViewer text={value.markdown.replace('---', '')} />
);
ModalMarkdown.propTypes = {
  value: PropTypes.shape({
    markdown: PropTypes.string
  })
};

export default ModalMarkdown;