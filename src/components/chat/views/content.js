import React from 'react';
import { marked } from 'marked';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import _ from 'lodash';

const Content = ({
  children,
  beak = false,
  position,
  text = null
}) => {
  if (!_.isEmpty(text)) {
    return (
      <div
        className={classNames('ui-chat-content message', { beak, [position]: true })}
        dangerouslySetInnerHTML={{
          __html: marked.parse(text.replace(/\n/g, '<br/>'))
        }}
      />
    );
  }
  return (
    <div className={classNames('ui-chat-content message', { beak, [position]: true })}>{children}</div>
  );
};
Content.propTypes = {
  text: PropTypes.string,
  beak: PropTypes.bool,
  position: PropTypes.oneOf(['first', 'middle', 'last']),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default Content;
