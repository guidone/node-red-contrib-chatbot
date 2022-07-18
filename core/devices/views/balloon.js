import React from 'react';
import { Icon, Popover } from 'rsuite';
import PropTypes from 'prop-types';
import _ from 'lodash';

import Image from './image';

const Balloon = ({ topic, ts, content, onDelete, onZoom, thumb, image, width, height, maxHeight, ...props }) => {
  let thumbImage;
  if (!_.isEmpty(thumb)) {
    thumbImage = (
      <Image
        thumb={thumb}
        topic={topic}
        width={width}
        height={height}
        maxHeight={maxHeight}
        onClick={() => {
          onZoom({ })
        }}
      />
    );
  }

  return (
    <Popover title={topic} {...props} onMouseLeave={() => {}}>
      <div className="popover-map-marker">
        {!_.isEmpty(thumb) && !_.isEmpty(image) && (
          <a href={image} onClick={e => {
            e.preventDefault();
            onZoom({ image, content });
          }}>{thumbImage}</a>
        )}
        {!_.isEmpty(thumb) && _.isEmpty(image) && thumbImage}
        {_.isEmpty(thumb) && !_.isEmpty(image) && (
          <a href={image} onClick={e => {
            e.preventDefault();
            onZoom({ image, content });
          }}>Show image</a>
        )}
        <div className="text">{content}</div>
        <span className="timestamp">
        {ts.toLocaleDateString()} - {ts.toLocaleTimeString()}
          &nbsp;-&nbsp;
          <a href="#" className="btn-delete" onClick={e => {
            e.preventDefault();
            onDelete();
          }}><Icon icon="trash"/></a>
    </span>
      </div>
    </Popover>
  );
};

Balloon.propTypes = {
  topic: PropTypes.string,
  thumb: PropTypes.string,
  image: PropTypes.string,
  content: PropTypes.string,
  ts: PropTypes.instanceOf(Date),
  onDelete: PropTypes.func,
  onZoom: PropTypes.func,
  width: PropTypes.number,
  height: PropTypes.number,
  maxHeight: PropTypes.number
};

Balloon.defaultProps = {
  topic: null,
  thumb: null,
  image: null,
  content: null,
  ts: null,
  onDelete: () => {},
  width: null,
  height: null
};

export default Balloon;
