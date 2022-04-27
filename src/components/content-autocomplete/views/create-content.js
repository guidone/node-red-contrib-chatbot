import React from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation } from 'react-apollo';

import { ModalContent } from '../../content';
import withoutParams from '../../../../src/helpers/without-params';

import { CATEGORIES, CREATE_CONTENT } from '../queries';

const CreateContent = ({
  content,
  onCancel = () => {},
  onSubmit = () => {},
  disabledLanguages,
  hasDelete = false,
  customFieldsSchema
}) => {
  const [createContent, { loading: createLoading, error: editError }] = useMutation(CREATE_CONTENT, {
    onCompleted: onSubmit
  });
  const { loading, error, data } = useQuery(CATEGORIES, {
    fetchPolicy: 'network-only'
  });

  const create = withoutParams(createContent, ['id', 'updatedAt', 'createdAt', '__typename', 'cid', 'category'])

  return (
    <ModalContent
      content={content}
      categories={data != null ? data.categories : []}
      error={editError || error}
      disabled={createLoading || loading}
      onCancel={onCancel}
      hasDelete={hasDelete}
      customFieldsSchema={customFieldsSchema}
      disabledLanguages={disabledLanguages}
      onSubmit={content => create({ variables: { content }})}
    />
  );
};
CreateContent.propTypes = {
  content: PropTypes.shape({
    title: PropTypes.string,
    id: PropTypes.number,
    slug: PropTypes.string,
    body: PropTypes.string
  }),
  hasDelete: PropTypes.bool,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  disabledLanguages: PropTypes.arrayOf(PropTypes.string),
  customFieldsSchema: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
    defaultValue: PropTypes.string,
    color: PropTypes.oneOf(['red','orange', 'yellow', 'green', 'cyan', 'blue', 'violet'])
  }))
};

export default CreateContent;