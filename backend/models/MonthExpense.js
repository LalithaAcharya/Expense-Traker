const mongoose = require('mongoose');

const monthExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('monthExpense', monthExpenseSchema);