import React from 'react';
import { Uploader, Icon, Button } from 'rsuite';
import _ from 'lodash';
import filesize from 'filesize';

import ImagePreload from '../../../src/components/image-preload';
import SmallTag from '../../../src/components/small-tag';

const cloudinaryImage = (url, { width, height, scale = false, crop = false } = {}) => {
  console.log('url', url)
  const modifiers = [];
  if (_.isNumber(width)) {
    modifiers.push(`w_${width}`);
  }
  if (_.isNumber(height)) {
    modifiers.push(`h_${height}`);
  }
  if (scale) {
    modifiers.push('c_scale');
  }
  if (crop) {
    modifiers.push('c_crop');
  }
  return _.isEmpty(modifiers) ? url : url.replace('/image/upload/', `/image/upload/${modifiers.join(',')}/`);
}

import '../style.scss';


const UploadImage = ({ formValue = {}, onChange = () => {} }) => {
  const { image } = formValue || {};

  const size = image != null ? filesize(image.size, { output: 'object' }) : null;
  const hasImage = formValue != null && formValue.image != null;

  return (
    <div className="content-upload-image">
      {hasImage && (
        <div className="preview">
          <div className="thumb">
            <ImagePreload src={cloudinaryImage(formValue.image.url, { width: 200, scale: true })} width={200} height={150}/>
          </div>
          <div className="meta">
            <div className="name">
              {image.name}
            </div>
            <div className="dimensions">
              {image.width} <span className="symbol">x</span> {image.height} <a href={image.url} target="_blank"><Icon icon="link"/></a>
            </div>
            <div className="size">
              <SmallTag color="#336699">{image.format}</SmallTag>
              &nbsp;
              {size != null && (
                <span className="size-container">
                  <span className="value">{size.value}</span> <span className="symbol">{size.symbol}</span>
                </span>
              )}
            </div>
            <div className="buttons">
              <Button size="sm" onClick={() => onChange(_.omit(formValue, 'image'))}>Clear image</Button>
            </div>
          </div>
        </div>
      )}
      {!hasImage && (
        <Uploader
          action="/mc/api/upload"
          dragable
          withCredentials
          multiple={false}

          onChange={fileList => {
            console.log('finito', fileList  )


          }}
          onSuccess={(image, file) => {
            console.log('upload ok', image)
            onChange({ ...formValue, image });
          }}
        >
          <div style={{ height: '200px', paddingTop: '80px' }}>
            Click or Drag files to this area to upload
          </div>
        </Uploader>
      )}
    </div>
  );

}

export default UploadImage;