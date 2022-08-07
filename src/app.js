/* eslint-disable react/no-children-prop */
import React, { useReducer, useEffect, useState, useMemo} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import gql from 'graphql-tag';
import { ApolloProvider } from 'react-apollo';
import { Container, Content, Loader } from 'rsuite';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom';
import { CodePlug, plug, useCodePlug } from 'code-plug';
import useCookie from 'react-use-cookie';

import sameArray from './helpers/same-array';
import getRoot from './helpers/get-root';
import { useNodeRedSocket } from './hooks/socket';

plug('reducers', (state, action) => {
  if (action.type === 'selectChatbot') {
    const currentPluginsSet = state.chatbot.plugins.map(({ plugin }) => plugin);
    const newPluginsSet = action.chatbot.plugins.map(({ plugin }) => plugin);
    // if plugins set are different, then needs a reload
    const needRestart = state.needRestart || !sameArray(currentPluginsSet, newPluginsSet);
    return {
      ...state,
      chatbotId: action.chatbot.chatbotId,
      chatbot: action.chatbot,
      needRestart
    };
  } else if (action.type === 'setChatbots') {
    return { ...state, chatbots: action.chatbots };
  } else if (action.type === 'setChatbot') {
    return {
      ...state,
      chatbots: state.chatbots.map(chatbot => chatbot.id === action.chatbot.id ? action.chatbot : chatbot )
    };
  } else if (action.type === 'dump') {
    // eslint-disable-next-line no-console
    console.log('current state:', state);
    return state;
  } else if (action.type === 'setActiveChatbots') {
    return {
      ...state,
      activeChatbots: action.activeChatbots
    };
  } else if (action.type === 'setEventTypes') {
    return {
      ...state,
      eventTypes: action.eventTypes
    };
  } else if (action.type === 'setMessageTypes') {
    return {
      ...state,
      messageTypes: action.messageTypes
    };
  } else if (action.type === 'setSimulatorChatbotIds') {
    return {
      ...state,
      simulatorChatbotIds: action.simulatorChatbotIds
    };
  }

  return state;
});


// Define the global scope to store the components shared with plugins
if (window.globalLibs == null) {
  window.globalLibs = {};
}

import compose from './helpers/compose-reducers';
import AppContext from './common/app-context';
import Sidebar from './layout/sidebar';
import Header from './layout/header';
import HomePage from './pages/home';
import PageNotFound from './layout/page-not-found';
import useClient from './hooks/client';
import { ModalProvider } from './components/modal';

// add an empty configuration menu, on order to be the first
plug('sidebar', null, {
  id: 'configuration',
  label: 'Configuration',
  permission: 'configure',
  icon: 'cog',
  order: 0,
  options: []
});


// Import plugins
import './components/index';
import './permissions';
import './plugins-core';

// add global define to import dinamically plugins
window.define = function(requires, factory) {
  let resolvedRequires = requires.map(lib => {
    if (lib.includes('/components')) {
      return window.globalLibs.Components;
    } else if (lib.includes('/hooks/socket')) {
      return window.globalLibs['hooks-socket'];
    } else if (window.globalLibs[lib] != null) {
      return window.globalLibs[lib];
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Library "${lib}" is not present in the global export list`);
      return {};
    }
  });
  factory(...resolvedRequires);
};

// export global libraries for plugins
import * as globalReact from 'react';
import * as globalPropTypes from 'prop-types';
import * as globalCodePlug from 'code-plug';
import _, * as globalLodash from 'lodash';
import * as globalRsuite from 'rsuite';
import * as globalUseHttp from 'use-http';
import * as globalGraphQLTag from 'graphql-tag';
import * as globalReactApollo from 'react-apollo';
import { useNodeRedSocket as globalUseNodeRedSocket } from './hooks/socket';
const globalUseSocket = { useNodeRedSocket: globalUseNodeRedSocket };


window.globalLibs.react = globalReact;
window.globalLibs['prop-types'] = globalPropTypes;
window.globalLibs['code-plug'] = globalCodePlug;
window.globalLibs.lodash = globalLodash;
window.globalLibs.rsuite = globalRsuite;
window.globalLibs['use-http'] = globalUseHttp;
window.globalLibs['graphql-tag'] = globalGraphQLTag;
window.globalLibs['react-apollo'] = globalReactApollo;
window.globalLibs['hooks-socket'] = globalUseSocket;

const initialState = {
  user: null,
  chatbots: [],
  chatbotId: null
};

const GET_CHATBOTS = gql`
query {
	chatbots {
    id,
    chatbotId,
    name,
    description,
    guid,
    plugins {
      id,
      plugin,
      version,
      filename
    }
  }
}`;

const usePrefetchedData = (client, { onComplete = () => {} }) => {
  // TODO move all this in the state
  const [platforms, setPlatforms] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [messageTypes, setMessageTypes] = useState([]);
  const [activeChatbots, setActiveChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  let chatbots = [];

  useEffect(() => {
    fetch('/redbot/platforms')
      .then(response => response.json())
      .then(response => setPlatforms(response.platforms))
      .then(() => client.query({ query: GET_CHATBOTS, fetchPolicy: 'network-only'}))
      .then(response => {
        if (response.data != null && response.data.chatbots) {
          chatbots = response.data.chatbots;
        }
      })
      .then(() => fetch('/redbot/globals'))
      .then(response => response.json())
      .then(response => {
        setEventTypes(response.eventTypes);
        setMessageTypes(response.messageTypes);
        setActiveChatbots(response.activeChatbots);
        setLoading(false);
        onComplete({
          platforms,
          eventTypes: response.eventTypes,
          messageTypes: response.messageTypes,
          activeChatbots: response.activeChatbots,
          loading,
          chatbots,
          simulatorChatbotIds: response.simulatorChatbotIds
        });
      });
  }, []);

  return { platforms, eventTypes, messageTypes, activeChatbots, loading, chatbots };
};

const RouterContainer = ({bootstrap, codePlug, dispatch }) => {
  useNodeRedSocket({
    onMessage: async (topic) => {
      if (topic === 'notification/runtime-deploy') {
        // if deployed, then fetch again the globals, the active chatbots can be different
        // in particular if the sender / receiver is inside a subflow, in that case the id is
        // an alias id and changes at every deploy
        const response = await fetch('/redbot/globals');
        const globals = await response.json();
        dispatch({ type: 'setActiveChatbots', activeChatbots: globals.activeChatbots });
        dispatch({ type: 'setSimulatorChatbotIds', simulatorChatbotIds: globals.simulatorChatbotIds });
      }
    }
  })
  const { items } = useCodePlug('pages', { permission: { '$intersect': bootstrap.user.permissions }})

  return (
    <Router basename={getRoot()}>
      <div className="mission-control-app">
        <Container className="mc-main-container">
          <Sidebar/>
          <Container className="mc-inner-container">
            <Header/>
            <Content className="mc-inner-content">
              <Switch>
                {items.map(({ view: View, props }) => (
                  // eslint-disable-next-line react/prop-types
                  <Route key={props.url} path={props.url} children={<View {...props} dispatch={dispatch}/>} />
                ))}
                <Route exact path="/" children={<HomePage dispatch={dispatch} codePlug={codePlug} />}/>
                <Route path="*" component={PageNotFound} />
              </Switch>
            </Content>
          </Container>
        </Container>
      </div>
    </Router>
  );
};
RouterContainer.propTypes = {
  bootstrap: PropTypes.object,
  codePlug: PropTypes.object,
  dispatch: PropTypes.func
};

const AppRouter = ({ codePlug, bootstrap }) => {
  const [chatbotId, setCookieChatbotId] = useCookie('chatbotId', '');
  const client = useClient(bootstrap.settings);

  const { platforms, eventTypes, messageTypes, activeChatbots, loading, chatbots } = usePrefetchedData(
    client, {
      onComplete: ({ chatbots, activeChatbots, eventTypes, messageTypes, simulatorChatbotIds }) => {
        dispatch({ type: 'setChatbots',  chatbots });
        dispatch({ type: 'setActiveChatbots', activeChatbots });
        dispatch({ type: 'setEventTypes', eventTypes });
        dispatch({ type: 'setMessageTypes', messageTypes });
        dispatch({ type: 'setSimulatorChatbotIds', simulatorChatbotIds });
        // preselect first available bot
        if (_.isEmpty(chatbotId)) {
          const bots = chatbots.filter(({ chatbotId }) => !_.isEmpty(chatbotId));
          if (!_.isEmpty(bots)) {
            dispatch({ type: 'selectChatbot', chatbot: bots[0] });
            setCookieChatbotId(bots[0].chatbotId);
          }
        }
      }
    });

  const reducers = useMemo(() => compose(...codePlug.getItems('reducers').map(item => item.view )));
  const [state, dispatch] = useReducer(reducers, {
    ...initialState,
    chatbotId,
    activeChatbots,
    chatbots,
    ...bootstrap
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '250px' }}>
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <ApolloProvider client={client}>
      <AppContext.Provider
        key="state-provider"
        value={{
          state,
          dispatch,
          client,
          platforms,
          eventTypes,
          messageTypes,
          //activeChatbots,
          chatbots
        }}
      >
        <ModalProvider>
          <RouterContainer
            codePlug={codePlug}
            bootstrap={bootstrap}
            dispatch={dispatch} />
        </ModalProvider>
      </AppContext.Provider>
    </ApolloProvider>
  );

};
AppRouter.propTypes = {
  bootstrap: PropTypes.object,
  codePlug: PropTypes.object
};

const App = ({ bootstrap }) => (
  <CodePlug>
    {codePlug => <AppRouter codePlug={codePlug} bootstrap={bootstrap}/>}
  </CodePlug>
);
App.propTypes = {
  bootstrap: PropTypes.object
};


// eslint-disable-next-line no-console
console.log(
  `Bootstrapping %cMissionControl%c (%cmode:%c${window.mc_environment}%c))`,
  'font-weight:bold',
  'font-weight:normal',
  'color:#999999',
  'color:#ff6633','color:#000000'
);
if (window.mc_environment === 'development') {
 // eslint-disable-next-line no-console
 console.log(`%cWarning: plugins are loaded from ./mc_plugins file since in development mode.
The list of installed plugins will not have any effect in development mode, run the application with %cDEV=plugin node-red%c`,
  'color:#999999',
  'font-family: monospace'
 );
} else if (window.mc_environment === 'plugin') {
  // eslint-disable-next-line no-console
  console.log(`%cWarning: running in plugin mode, plugins code is loaded from repo and installed locally.
In order to develop plugins, run the application with %cDEV=dev node-red%c`,
  'color:#999999',
  'font-family: monospace'
 );
}

(async function() {
  if (window.mc_environment === 'development') {
    await import('../plugins')
  }
  ReactDOM.render(<App bootstrap={bootstrap}/>, document.querySelector('#mission-control'));
})();


export default App;