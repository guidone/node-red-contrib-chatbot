import React from 'react';

// This component could be called multiple times in plugin, always return the same instance
let AppContext;
if (window.AppContext != null) {
  AppContext = window.AppContext;
} else {
  AppContext = React.createContext({});
  window.AppContext = AppContext;
}

export default AppContext;