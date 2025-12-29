require('dotenv').config();
const express = require('express');

const app = express();
const PORT = 8888;

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple test server running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/test`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Keep server running
setInterval(() => {
  console.log('Server still alive...');
}, 30000);
