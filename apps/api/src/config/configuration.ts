export default () => ({
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  security: {
    rateLimitWindowSeconds: process.env.RATE_LIMIT_WINDOW_SECONDS,
    rateLimitMaxReadRequests: process.env.RATE_LIMIT_MAX_READ_REQUESTS,
    rateLimitMaxSensitiveReadRequests:
      process.env.RATE_LIMIT_MAX_SENSITIVE_READ_REQUESTS,
    rateLimitMaxWriteRequests: process.env.RATE_LIMIT_MAX_WRITE_REQUESTS
  },
  mongodbUri: process.env.MONGODB_URI,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  },
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY
  }
});
