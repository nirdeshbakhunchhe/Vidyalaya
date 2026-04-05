import cloudinary from '../config/cloudinary.js';

const fileToDataUri = ({ buffer, mimetype }) => {
  if (!buffer || !buffer.length) throw new Error('Empty upload buffer');
  if (!mimetype) throw new Error('Missing mimetype');
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
};

export const uploadToCloudinary = async ({
  buffer,
  mimetype,
  folder,
  resourceType = 'image',
  publicId,
  overwrite = true,
}) => {
  const dataUri = fileToDataUri({ buffer, mimetype });

  const uploadOptions = {
    folder,
    resource_type: resourceType,
    overwrite,
  };

  if (publicId) uploadOptions.public_id = publicId;

  const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

  // Important: we store ONLY these two values in MongoDB.
  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
};
