import React from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation } from 'react-apollo';

// TODO move this in a common component
import ModalContent from '../../../../plugins/content/views/modal-content';
import withoutParams from '../../../../src/helpers/without-params';

import { CONTENT, EDIT_CONTENT } from '../queries';


const ContentPreview = ({ contentId, onCancel = () => {}, onSubmit = () => {} }) => {

  const { loading, error, data } = useQuery(CONTENT, {
    fetchPolicy: 'network-only',
    variables: { 
      id: contentId
    }
  });

  const [editContent, { loading: editLoading, error: editError }] = useMutation(EDIT_CONTENT, { 
    onCompleted: onSubmit
  });

  const edit = withoutParams(editContent, ['id', 'updatedAt', 'createdAt', '__typename', 'cid', 'category'])

  if (loading) {
    return null;
  }

  return (
    <ModalContent
      content={data.content}
      error={error || editError}
      disabled={editLoading}    
      categories={data.categories}
      onCancel={onCancel}
      onSubmit={content => edit({ variables: { id: content.id, content }})}
    />
  );
};

export default ContentPreview;