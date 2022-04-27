import React from 'react';
import isPlugin from '../helpers/is-plugin';
import isFunction from '../helpers/is-function';
import maybe from '../helpers/maybe';
import { anonymousViews } from './plug';
import PlugItContext from '../context';


const filterWith = (hooks, plugin, props) => {
  let result = true;
  hooks.forEach(hook => {
    if (result) {
      result = !!hook.call({ props }, plugin);

    }
  });
  return result;
};

class CodePlug extends React.Component {

  // todo proptypes

  static defaultProps = {
    debug: false,
    plugins: [],
    hooks: [],
    hash: plugins => plugins.length
  };

  constructor(props) {
    super(props);

    this.getItems = this.getItems.bind(this);

    this.state = {
      plugins: [],
      allPlugins: []
    };
  }

  static getDerivedStateFromProps = function(props, state) {    
    const { plugins, hooks, hash, ...newProps } = props;

    if (state == null || state.plugins == null || hash(state.allPlugins) !== hash(props.plugins)) {
      const filteredPlugins = (plugins || [])
        .filter(plugin => filterWith(hooks, plugin, props))
        .map(plugin => new plugin(newProps));
      return {
        plugins: filteredPlugins,
        allPlugins: [...plugins]
      };
    }

    return null;
  }

  getHooks() {
    const { plugins } = this.props;
    return plugins
      .filter(plugin => isFunction(plugin) && !isPlugin(plugin));
  }

  getPlugins() {
    return this.state.plugins;
  }

  getAllPlugins() {
    return this.state.allPlugins;
  }

  debug() {
    this.state.allPlugins.forEach(plugin => {
      console.log('- ', plugin.description.name, `(id: ${plugin.description.id}, ver:${plugin.description.version})`)
    });
  }
  
  getItems(region, props = null) {
    const { plugins } = this.state;

    const anonymousItems = maybe(anonymousViews[region])
      .map(item => ({
        view: item.view,
        props: isFunction(item.props) ? item.props(props) : item.props,
        plugin: null
      }))
      .reduce((a, v) => a.concat(v), []) //flatten
      .filter(Boolean); //compact

    const items = plugins
      .map(plugin => (
        maybe(plugin.getViews(region))
          .map(item => ({
            view: item.view,
            props: isFunction(item.props) ? item.props(props) : item.props,
            plugin
          })))
      ) // enrich with plugin
      .reduce((a, v) => a.concat(v), []) //flatten
      .filter(Boolean); //compact

    return [...anonymousItems, ...items];
  }


  render() {
    const { plugins } = this.state;
    const { children } = this.props;

    return (
      <PlugItContext.Provider value={{ plugins, codePlug: this }}>
        {isFunction(children) ? children(this) : children}
      </PlugItContext.Provider>
    );
  }
}

export default CodePlug;
