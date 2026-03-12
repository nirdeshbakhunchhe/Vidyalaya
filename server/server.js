import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import courseRoutes from './routes/courses.js';
import chatRoutes from './routes/chatRoutes.js'; // ← Add this

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Vidyalaya API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);  
app.use('/api/chat', chatRoutes); // ← Add this

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});