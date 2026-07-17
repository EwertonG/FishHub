import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
import fishRoutes from './src/routes/fishRoutes.js';
import postRoutes from './src/routes/postRoutes.js';
import aquariumRoutes from './src/routes/aquariumRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.use('/api/uploads', express.static(uploadDir));

app.use('/api', authRoutes);
app.use('/api/fishes', fishRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/aquariums', aquariumRoutes);
app.use('/api/upload', uploadRoutes);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`FishHub Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
}

startServer();
