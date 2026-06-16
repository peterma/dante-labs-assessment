const REQUIRED = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRE', 'COOKIE_EXPIRE'];

function validateEnv() {
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\n[validateEnv] Missing required environment variables:\n  ${missing.join('\n  ')}`);
    console.error('\nCopy .env.example to server/config/config.env and fill in real values.\n');
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.warn(
      '[validateEnv] WARNING: JWT_SECRET is too short. Generate with:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }
}

module.exports = validateEnv;
