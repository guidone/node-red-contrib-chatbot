import { plug } from 'code-plug';

import UploadImage from './views/upload-image';

plug('content-tabs', UploadImage, {
  id: 'content-image',
  label: 'Image',
  permission: 'content.uploadImage'
});
// permission to load an image into a content
plug(
  'permissions',
  null,
  {
    permission: 'content.uploadImage',
    name: 'Upload Image',
    description: 'Attach an image to a content',
    group: 'Content'
  }
);