const mongoose = require('mongoose');

const AddExpenseSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Unique identifier for the user
    expenses: [
        {
            title: { type: String, required: true },
            amount: { type: Number, required: true },
        },
    ],
    status: { type: String, default: 'draft' }, // 'draft' or 'submitted'
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AddExpense', AddExpenseSchema);
