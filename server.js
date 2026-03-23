const express = require('express');
const app = express();

// Enforce HTTPS and add HSTS with preload
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(301, `https://${req.header('host')}${req.url}`);
    return;
  }
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// Health check for Cloud Run
app.get('/health', (req, res) => res.send('healthy'));

// Main route
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Google Cloud Run!',
    https: true,
    hsts: true,
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
