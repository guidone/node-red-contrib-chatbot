import React, { useState, useEffect } from 'react';
import { Notification } from 'rsuite';
import { Responsive, WidthProvider } from 'react-grid-layout';

import useConfiguration from '../hooks/configuration';
import { useCodePlug } from 'code-plug';
import useCurrentUser from '../hooks/current-user';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

import '../../node_modules/react-grid-layout/css/styles.css';
import '../../node_modules/react-resizable/css/styles.css';

const HomePage = () => {
  const { permissionQuery } = useCurrentUser();
  //const { state } = useMCContext();
  const { items } = useCodePlug('widgets', permissionQuery);
  const { loading, data, saving, update } = useConfiguration({
    namespace: 'dashboard',
    onCompleted: () => {
      Notification.success({ title: 'Configuration', description: 'Configuration saved successful' });
    }
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
          // avoid multiple calling
          isLoaded && !saving && update(layouts);
        }}
      >
        {items.map(({ view: View, props: widgetProps }) => {
          const { x, y, h, w, isResizable, minW, maxW } = widgetProps;
          return (
            <div key={widgetProps.id} data-grid={{x, y, w, h, isResizable, minW, maxW }}>
              <View {...widgetProps}/>
            </div>
          );
        })}
      </ResponsiveReactGridLayout>
    </div>
  );
};

export default HomePage;
