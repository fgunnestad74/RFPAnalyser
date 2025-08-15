import express from 'express';

const app = express();
const PORT = 3001;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server running' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});