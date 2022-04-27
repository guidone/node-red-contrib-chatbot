import React from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation } from 'react-apollo';

import { ModalContent } from '../../content';
import withoutParams from '../../../../src/helpers/without-params';

import { CONTENT, EDIT_CONTENT, DELETE_CONTENT } from '../queries';

const ContentPreview = ({
  contentId,
  onCancel = () => {},
  onSubmit = () => {},
  onDelete = () => {},
  customFieldsSchema
}) => {
  const { loading, error, data } = useQuery(CONTENT, {
    fetchPolicy: 'network-only',
    variables: {
      id: contentId
    }
  });

  const [editContent, { loading: editLoading, error: editError }] = useMutation(EDIT_CONTENT, {
    onCompleted: onSubmit
  });
  const [deleteContent, { loading: deleteLoading, error: deleteError }] = useMutation(DELETE_CONTENT, {
    onCompleted: onDelete
  });

  const edit = withoutParams(editContent, ['id', 'updatedAt', 'createdAt', '__typename', 'cid', 'category'])

  if (loading) {
    return null;
  }

  return (
    <ModalContent
      content={data.content}
      hasDelete={true}
      onDelete={onDelete}
      error={error || editError || deleteError}
      disabled={editLoading || deleteLoading}
      categories={data.categories}
      onCancel={onCancel}
      customFieldsSchema={customFieldsSchema}
      onDelete={content => deleteContent({ variables: { id: content.id }})}
      onSubmit={content => edit({ variables: { id: content.id, content }})}
    />
  );
};
ContentPreview.propTypes = {
  contentId: PropTypes.number,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  onDelete: PropTypes.func,
  customFieldsSchema: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
    defaultValue: PropTypes.string,
    color: PropTypes.oneOf(['red','orange', 'yellow', 'green', 'cyan', 'blue', 'violet'])
  }))
};

export default ContentPreview;