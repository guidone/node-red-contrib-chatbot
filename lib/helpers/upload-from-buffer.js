const streamifier = require('streamifier');

module.exports = (buffer, cloudinary) => {
  return new Promise((resolve, reject) => {
    let cldUploadStream = cloudinary.uploader.upload_stream(
     {
       folder: 'mc',
       use_filename: true
     },
     (error, result) => {
       if (result) {
         resolve(result);
       } else {
         reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(cldUploadStream);
  });
};