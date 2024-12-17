const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: {
    type: Date,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('Income', IncomeSchema);
