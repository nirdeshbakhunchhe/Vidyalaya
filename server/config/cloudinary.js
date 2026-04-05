import { v2 as cloudinary } from 'cloudinary';

// Cloudinary is initialized once for the whole server process.
// `server.js` already imports `./config/env.js` first, so process.env is available.
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export default cloudinary;
