const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://localhost:5173',
    'https://my-money-assistant.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options(/.*/, cors());

app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const transactionsRoutes = require('./routes/transactions');
const categoriesRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const forecastRoutes = require('./routes/forecast');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/forecast', forecastRoutes);


// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MoneyAI Backend is running' });
});

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'MoneyAI Backend is running 🚀' });
});

module.exports = app;

// const PORT = process.env.PORT || 5000;

// Only start the server if this file is run directly
// if (require.main === module) {
//   app.listen(PORT, () => {
//     // Added backticks below to fix the syntax error
//     console.log(`🚀 Server is running on http://localhost:${PORT}`);
//     console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
//   });
// }