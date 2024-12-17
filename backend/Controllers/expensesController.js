const Expense = require('../models/PlanExpenses');
const jwt = require('jsonwebtoken'); // For token validation

// POST endpoint to submit expenses
const submitExpenses = async (req, res) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(' ')[1]; // Bearer token
    if (!token) {
      return res.status(403).json({ message: 'Token required' });
    }

    // Verify the token and get the user ID
    const decoded = jwt.verify(token, 'your-secret-key'); // Use your secret key here
    const userId = decoded.id;

    // Extract expenses data from the request body
    const { expenses } = req.body;

    // Validate that expenses array is not empty
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ message: 'No expenses provided' });
    }

    // Save the expenses to the database
    const expenseRecords = expenses.map(expense => ({
      ...expense,
      userId,
    }));

    await Expense.insertMany(expenseRecords);

    return res.status(201).json({ message: 'Expenses submitted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { submitExpenses };
