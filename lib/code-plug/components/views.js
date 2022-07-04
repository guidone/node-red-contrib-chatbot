import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import isFunction from '../helpers/is-function';
import generateKey from '../helpers/generate-key';
import PlugItContext from '../context';
import { anonymousViews } from './plug';


class Views extends React.Component {
  static contextType = PlugItContext;

  static propTypes = {
    style: PropTypes.object,
    region: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array
    ]).isRequired,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
      PropTypes.func
  ])
  };

  render() {
    const { region, children: renderProp } = this.props;
    // eslint-disable-next-line no-unused-vars
    const { region: _region, ...rest } = this.props;
    const { plugins } = this.context;
    const dom = plugins
      .map(plugin => {
        return (plugin.getViews(region) || []).map(item => {
          const props = isFunction(item.props) ? item.props(rest) : { ...item.props };
          const View = item.view;
          if (typeof renderProp === 'function') {
            return renderProp(View, { key: generateKey(View, props), ...rest, ...props }, plugin);
          } else {
            return <View key={generateKey(View, props)} {...rest} {...props} />;
          }
        });
      })
      .reduce((a, v) => a.concat(v), []) //flatten
      .filter(Boolean); //compact


    const domAnonymous = (anonymousViews[region] || []).map(item => {
      const props = isFunction(item.props) ? item.props(rest) : { ...item.props };
      const View = item.view;
      if (typeof renderProp === 'function') {
        return renderProp(View, { key: generateKey(View, props), ...rest, ...props });
      } else {
        return <View key={generateKey(View, props)} {...rest} {...props} />;
      }
    });

    return <Fragment>{[...dom, ...domAnonymous]}</Fragment>;
  }
}

export default Views;
