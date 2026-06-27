// Simple static file server for the frontend
// Run: node frontend/server.js
// Then open: http://localhost:5500

const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = 5500;

app.use(express.static(path.join(__dirname, 'public')));

// Fallback — serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend running on http://localhost:${PORT}`);
});
