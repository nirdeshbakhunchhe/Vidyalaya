import './config/env.js'; // ← must be first — loads dotenv before any other module
import express from 'express';
import http from 'http';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import { initSocket } from './socket.js';
import { errorHandler } from './middleware/errorHandler.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import chatRoutes from './routes/chatRoutes.js';
import paymentRoutes from './routes/payment.route.js';
import assignmentsRoutes from './routes/assignments.route.js';
import progressRoutes from './routes/progress.routes.js';
import notificationRoutes from './routes/notifications.route.js';

connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Vidyalaya API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});