import React, { useState, useEffect } from 'react';
import { Notification } from 'rsuite';
import { Responsive, WidthProvider } from 'react-grid-layout';


import withState from '../wrappers/with-state';
import useConfiguration from '../hooks/configuration';
import { useCodePlug } from 'code-plug';
import useCurrentUser from '../hooks/current-user';
import useMCContext from '..//hooks/mc-context';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

import '../../node_modules/react-grid-layout/css/styles.css';
import '../../node_modules/react-resizable/css/styles.css';


/*const Widget2 = ({ count, user, dispatch }) => (
  <Panel title="I am a title">
    <span>count: {count} {user}</span>
    <Views region="items"/>
    <Button onClick={() => dispatch({ type: 'increment' })}>inc</Button>
    <Button onClick={() => dispatch({ type: 'decrement' })}>dec</Button>
    <Button onClick={() => dispatch({ type: 'user' })}>user</Button>
  </Panel>
);



plug('widgets', withDispatch(withState(Widget2, ['count', 'user'])), { x: 0, y: 0, w: 1, h: 4, isResizable: false, id: 2 })

plug('reducers', (state, action) => {
  if (action.type === 'socket.message') {
    let counter = state.stats != null ? state.stats : 0;
    return { ...state, stats: counter + 1 };
  } else {
    return state;
  }
});*/

const HomePage = ({ count, dispatch, user }) => {
  const { permissionQuery } = useCurrentUser();
  const { state } = useMCContext();
  const { items } = useCodePlug('widgets', permissionQuery);
  const { loading, saving, error, data, update } = useConfiguration({
    namespace: 'dashboard',
    onCompleted: () => Notification.success({ title: 'Configuration', description: 'Configuration saved successful' })
  });
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 1000);
  }, []);


  if (loading) {
    return (
      <div className="loading"></div>
    );
  }


  return (
    <div className="mc-home">
      <ResponsiveReactGridLayout
        className="layout"
        compactType="horizontal"
        cols={{ lg: 4, md: 4, sm: 3, xs: 2, xxs: 1 }}
        draggableCancel=".ui-grid-panel *:not(.ui-panel-title),.rs-modal *"
        rowHeight={50}
        margin={[20, 20]}
        layouts={data}
        onLayoutChange={(layout, layouts) => {
          isLoaded && update(layouts);
        }}
      >
        {items.map(({ view: View, props }) => {
          const { x, y, h, w, isResizable, minW, maxW } = props;
          return (
            <div key={props.id} data-grid={{x, y, w, h, isResizable, minW, maxW }}>
              <View {...props}/>
            </div>
          );
        })}
      </ResponsiveReactGridLayout>
    </div>
  );

}

export default withState(HomePage, ['count']);
