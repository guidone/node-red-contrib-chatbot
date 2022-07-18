import React from 'react';
import { FlexboxGrid } from 'rsuite';
import gql from 'graphql-tag';
import { useQuery, useMutation } from 'react-apollo';
import { Notification } from 'rsuite';
import _ from 'lodash';

import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import ShowError from '../../../src/components/show-error';
import useMCContext from '../../../src/hooks/mc-context';

import ConfigurationForm from '../views/configuration-form';

const GET_CHATBOT = gql`
query($chatbotId: String!) {
  chatbot(chatbotId: $chatbotId) {
    id,
    name,
    description,
    guid,
    chatbotId
  }
}
`;

const UPDATE_CHATBOT = gql`
mutation($id: Int!, $chatbot: InputChatbot!) {
  chatbot: editChatbot(id: $id, chatbot: $chatbot) {
    id,
    name,
    description,
    guid,
    chatbotId
  }
}
`;

const ConfigureChatbot = () => {
  const { state, dispatch } = useMCContext();
  const { loading, error: loadError, data } = useQuery(GET_CHATBOT, {
    variables: {
      chatbotId: state.chatbotId
    },
    fetchPolicy: 'network-only',
    skip: _.isEmpty(state.chatbotId)
  });
  const [
    editChatbot,
    { loading: editLoading, error: editError },
  ] = useMutation(UPDATE_CHATBOT, {
    onCompleted: ({ chatbot }) => {
      dispatch({ type: 'setChatbot', chatbot });
      Notification.success({ title: 'Configuration', description: 'Configuration saved successful' });
    }
  });

  console.log('loading', loading)
  const ready = !loading;
  const disabled = editLoading;
  const error = loadError || editError;

  return (
    <PageContainer className="page-configuration">
      {_.isEmpty(state.chatbotId) && (
        <>
          <Breadcrumbs pages={['Chatbot']}/>
          <FlexboxGrid justify="space-between">
            <FlexboxGrid.Item colspan={17} style={{ paddingTop: '20px', paddingLeft: '20px' }}>
              <strong>Select a chatbot</strong> from the drop down menu in the top right corner.
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </>
      )}
      {!_.isEmpty(state.chatbotId) && (
        <>
          <Breadcrumbs pages={ready ? ['Chatbot', data.chatbot?.name] : ['Chatbot']}/>
          {error != null && <ShowError error={error} />}
          <FlexboxGrid justify="space-between">
            <FlexboxGrid.Item colspan={17} style={{ paddingTop: '20px', paddingLeft: '20px' }}>
              {ready && (
                <ConfigurationForm
                  value={_.omit(data.chatbot, ['id', 'updatedAt', 'createdAt', '__typename'])}
                  disabled={disabled}
                  onSubmit={chatbot => editChatbot({
                    variables: { chatbot, id: data.chatbot.id }
                  })}
                />
              )}
            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={7} style={{ paddingTop: '20px', paddingLeft: '20px' }}>

            </FlexboxGrid.Item>
          </FlexboxGrid>
      </>
      )}
    </PageContainer>
  );
};

export default ConfigureChatbot;