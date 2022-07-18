import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Showdown from 'showdown';

import './style.scss';

const MarkdownViewer = ({ text }) => {
  const converter = useMemo(() => new Showdown.Converter({ openLinksInNewWindow: true }));
  return (
    <div
      className="ui-markdown-viewer"
      dangerouslySetInnerHTML={{ __html: converter.makeHtml(text)}}
    />
  );
};
MarkdownViewer.propTypes = {
  text: PropTypes.string
};

export default MarkdownViewer;