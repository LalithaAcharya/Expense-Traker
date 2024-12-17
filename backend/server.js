const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const { submitExpenses } = require('./Controllers/expensesController');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.use(express.json({ limit: '10mb' })); // Increase limit to 10MB for JSON payloads
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database connection
mongoose.connect('mongodb://localhost:27017/loginapp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
