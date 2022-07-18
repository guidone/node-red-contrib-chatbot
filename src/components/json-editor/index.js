import React from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';

const JSONEditor = ({ style, ...rest }) => (
  <div style={style}>
    <AceEditor
      mode="javascript"
      height="200px"
      width="100%"
      theme="monokai"
      tabSize={2}
      name="json_editor"
      editorProps={{ $blockScrolling: true }}
      {...rest}
      value={rest.value}
    />
  </div>
);
JSONEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  style: PropTypes.object,
  height: PropTypes.string
};

export default JSONEditor;