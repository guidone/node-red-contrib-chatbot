import React from 'react';
import SimpleMDE from 'simplemde';
import PropTypes from 'prop-types';

import '../../../node_modules/simplemde/dist/simplemde.min.css';
import './style.scss';

class MarkdownEditor extends React.Component {

  componentDidMount() {
    const { value, onChange } = this.props;

    this.simplemde = new SimpleMDE({ 
      element: this.textarea,
      initialValue: value,
      spellChecker: false
    });
    this.simplemde.codemirror.on('change', () => onChange(this.simplemde.value()));
  }

  componentWillUnmount() {
    this.simplemde.toTextArea();
    this.simplemde = null;  
  }

  render() {
    return (
      <div className="ui-markdown-editor">
        <textarea ref={ref => this.textarea = ref}/>
      </div>
    );
  }
}
MarkdownEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default MarkdownEditor;