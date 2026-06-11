import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SPIL Intelligence API' });
});

app.use('/api/v1', routes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SPIL Intelligence API running on http://localhost:${PORT}`);
});
