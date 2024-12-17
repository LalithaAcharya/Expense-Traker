const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,  // Ensure amount is a number, not a string
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the user submitting the expenses
    required: true,
  },
  date: {
    type: Date,  // Add a date field to store the date of the expense
    required: true,
  },
}, {
  timestamps: true,  // Automatically adds createdAt and updatedAt fields
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
