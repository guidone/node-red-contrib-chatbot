import React, { Fragment} from 'react';
import isFunction from "../helpers/is-function";
import PlugItContext from '../context';

class Items extends React.Component {
  static contextType = PlugItContext;

  render() {

    const { region, children: renderProp } = this.props;
    // eslint-disable-next-line no-unused-vars
    const { region: _region, ...rest } = this.props;
    const { plugins } = this.context;

    const collection = plugins
      .map(plugin => {
        return (plugin.getViews(region) || []).map(item => {
          return {
            view: item.view,
            props: isFunction(item.props) ? item.props(rest) : item.props,
            plugin
          };
        });

      })
      .reduce((a, v) => a.concat(v), []) //flatten
      .filter(Boolean); //compact

    return <Fragment>{renderProp(collection)}</Fragment>;
  }
}

export default Items;
