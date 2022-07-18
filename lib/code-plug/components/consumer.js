import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import isFunction from '../helpers/is-function';
import PlugItContext from '../context';

class Consumer extends React.Component {

  static contextType = PlugItContext;

  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
      PropTypes.func
    ])
  };

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
