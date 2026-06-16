const app = require('./app');
const connectDatabase = require('./config/database');
const cloudinary = require('cloudinary');
const PORT = process.env.PORT || 4000;

let isShuttingDown = false;

function shutdown(code) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  if (server) {
    server.close(() => process.exit(code));
    setTimeout(() => process.exit(code), 5000).unref();
  } else {
    process.exit(code);
  }
}

process.on('uncaughtException', err => {
  console.error(`Uncaught Exception: ${err.message}`);
  shutdown(1);
});

// connectDatabase();

const cloudinaryConfigured =
  process.env.CLOUDINARY_NAME &&
  process.env.CLOUDINARY_NAME !== 'placeholder' &&
  process.env.CLOUDINARY_API_KEY;

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', err => {
  console.error(`Unhandled Rejection: ${err.message}`);
  shutdown(1);
});
