const express = require('express');
const app = express();
const PORT = 8888;

app.use(express.static('public'));

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal server working!' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close();
  process.exit(0);
});
