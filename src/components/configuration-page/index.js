import React from 'react';
import { FlexboxGrid, Notification, Tag } from 'rsuite';

import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import InfoPanel from '../../../src/components/info-panel';
import ShowError from '../../../src/components/show-error';
//import ConfigurationForm from '../views/form';
import useConfiguration from '../../../src/hooks/configuration';

const withConfigurationPage = (namespace, ConfigurationForm, { Legend = null, title } = {}) => {

  return () => {
    const { loading, saving, error, data, update } = useConfiguration({
      namespace,
      onCompleted: () => Notification.success({ title: 'Configuration', description: 'Configuration saved successful' })
    });
    // TODO fix loading
    // TODO error component
    // TODO move to basic configuration layout the flexigird

    let breadcrumbs = ['Configuration'];
    if (_.isString(title)) {
      breadcrumbs = [...breadcrumbs, title];
    } else if (_.isArray(title)) {
      breadcrumbs = [...breadcrumbs, ...title];
    }

    return (
      <PageContainer className="page-configuration">
        <Breadcrumbs pages={breadcrumbs}/>
        <FlexboxGrid justify="space-between">
          <FlexboxGrid.Item colspan={Legend != null ? 17 : 24} style={{ paddingTop: '20px', paddingLeft: '20px' }}>
            {loading && <div>loading</div>}
            {error && (
              <ShowError
                title="Configuration error"
                error={error}/>
              )}
            {!loading && !error && (
              <ConfigurationForm
                disabled={saving}
                value={data}
                onSubmit={formValue => update(formValue)}
              />
            )}
          </FlexboxGrid.Item>
          {Legend != null && (
            <InfoPanel colspan={7}>
              <Legend />
            </InfoPanel>
          )}
        </FlexboxGrid>
      </PageContainer>
    );
  };

};

export default withConfigurationPage;
