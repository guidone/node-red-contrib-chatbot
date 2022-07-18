import React, { useState } from 'react';

import CreateContent from '../views/create-content';

const useCreateContent = ({ onComplete = () => {} }) => {
  const [content, setContent] = useState(null);
  const [props, setProps] = useState(null)

  let modal;
  if (content != null) {
    console.log('create content', props)
    modal = (
      <CreateContent
        content={content}
        {...props}
        onCancel={() => setContent(null)}
        onSubmit={response => {
          setContent(null);
          onComplete(response.createContent);
        }}
      />
    );
  }

  return {
    createContent: (contentDefault, props) => {
      setProps(props);
      setContent(contentDefault);
    },
    modal
  };
};

export default useCreateContent;