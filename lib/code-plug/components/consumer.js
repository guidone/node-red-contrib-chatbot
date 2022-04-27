import React from 'react';
import isFunction from '../helpers/is-function';
import PlugItContext from '../context';

class Consumer extends React.Component {

  static contextType = PlugItContext;

  render() {
    const { codePlug } = this.context;

    return (
      <Fragment>
        {isFunction(this.props.children) ? this.props.children(codePlug) : this.props.children}
      </Fragment>
    );
  }
}

export default Consumer;
