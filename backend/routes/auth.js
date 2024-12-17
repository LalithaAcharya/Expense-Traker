const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Income = require('../models/SetIncome');
const Expense = require('../models/PlanExpenses');
 const MonthExpense = require('../models/MonthExpense');
 const AddExpense = require('../models/AddExpense')
 const { DateTime } = require('luxon');
 const mongoose = require('mongoose');

const router = express.Router();
const app = express();
const SECRET_KEY = "your_secret_key"; // Replace with an environment variable in production



// Register route
// router.post('/register', async (req, res) => {
//     try {
//         const hashedPassword = await bcrypt.hash(req.body.password, 10);
//         const newUser = new User({ username: req.body.username, password: hashedPassword });
//         await newUser.save();
//         res.status(201).json({ message: 'User registered successfully' });
//     } catch (error) {
//         res.status(400).json({ error: 'User registration failed' });
//     }
// });

router.post('/register', async (req, res) => {
    try {
        // Check if the username already exists
      
        const existingUser = await User.findOne({ username: req.body.username });
        
        if (existingUser) {
           
            return res.status(400).json({ error: 'Username is already taken' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create and save the new user
        const newUser = new User({ username: req.body.username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'User registration failed.'});
    }
});


// Login route
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.clearCookie('connect.sid'); // Clear session cookie
            res.status(200).json({ message: 'Logged out successfully' });
        });
    } else {
        res.status(400).json({ error: 'No active session to destroy' });
    }
});

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.userId = decoded.id;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token.' });
    }
  };

  router.post('/user-profile', authenticate, async (req, res) => {
    const { name, email, designation, image } = req.body;
  
    if (!name || !email || !designation) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      // Check if a profile already exists for the authenticated user
      let profile = await Profile.findOne({ userId: req.userId });
  
      if (profile) {
        // Update existing profile
        profile.name = name;
        profile.email = email;
        profile.designation = designation;
        profile.image = image;
        await profile.save();
      } else {
        // Create a new profile
        profile = new Profile({
          userId: req.userId,
          name,
          email,
          designation,
          image,
        });
        await profile.save();
      }
  
      return res.status(200).json({
        message: 'Profile updated successfully',
        data: profile,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Fetch user profile
  router.get('/user-profile', authenticate, async (req, res) => {
    try {
      const profile = await Profile.findOne({ userId: req.userId });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      return res.status(200).json({
        message: 'Profile retrieved successfully',
        data: profile,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/set-income', authenticate, async (req, res) => {
    const { date, salary } = req.body;
  
    if (!date || !salary) {
      return res.status(400).json({ message: 'Date and salary are required' });
    }
  
    try {
      // Check if a record already exists for the user and the selected date
      const existingIncome = await Income.findOne({ userId: req.userId, date });
  
      if (existingIncome) {
        return res.status(400).json({ message: 'Income record for this date already exists' });
      }
  
      // Create a new income record if no existing record is found
      const income = new Income({
        userId: req.userId,
        date,
        salary,
      });
  
      await income.save();
  
      return res.status(200).json({
        message: 'Income saved successfully',
        data: income,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  

router.get('/get-income', authenticate, async (req, res) => {
    try {
      // Fetch all income records for the authenticated user
      const incomes = await Income.find({ userId: req.userId });
  
      if (incomes.length === 0) {
        return res.status(404).json({ message: 'No income records found' });
      }
  
      return res.status(200).json({
        message: 'Income records retrieved successfully',
        data: incomes, // Return all the income records in an array
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/delete-income', authenticate, async (req, res) => {
    try {
        const userId = req.userId; // Extracted by authenticate middleware
        const { date, salary } = req.body; // The date and salary of the record to delete

        if (!date || !salary) {
            return res.status(400).json({
                success: false,
                message: 'Date and Salary are required to delete an income record.'
            });
        }

        // Find and delete the income record for the authenticated user
        const deletedIncome = await Income.findOneAndDelete({ userId, date, salary });

        if (!deletedIncome) {
            return res.status(404).json({
                success: false,
                message: 'No income record found to delete.'
            });
        }

        return res.json({
            success: true,
            message: 'Income record deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting income record:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
        });
    }
});


  router.get('/get-latest-salary', authenticate, async (req, res) => {
    try {
      // Fetch the latest income record for the authenticated user
      const latestIncome = await Income.findOne({ userId: req.userId })
        .sort({ date: -1 }) // Sort records by date in descending order
        .exec(); // Execute the query
  
      if (!latestIncome) {
        return res.status(404).json({ message: 'No income records found' });
      }
  
      return res.status(200).json({
        message: 'Latest income record retrieved successfully',
        data: latestIncome, // Return only the latest record
      });
    } catch (err) {
      console.error('Error fetching latest income:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  router.post('/submit-expenses', authenticate, async (req, res) => {
    try {
      const { expenses, date } = req.body; // Destructure expenses and date from the request body
      if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
        return res.status(400).json({ message: 'Expenses data is required' });
      }
  
      if (!date) {
        return res.status(400).json({ message: 'Date is required' }); // Validate date
      }
  
      // Calculate the total amount from the expenses
      const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  
      // Iterate through each expense and save it to the database
      const userId = req.userId; // The authenticated user ID (set by the authenticate middleware)
      const savedExpenses = await Expense.insertMany(
        expenses.map(expense => ({
          title: expense.title,
          amount: parseFloat(expense.amount),
          userId,
          date, // Add date to each expense
        }))
      );
  
      // Optionally, you can respond with the saved expenses and total amount
      res.status(201).json({
        message: 'Expenses submitted successfully',
        totalAmount,
        savedExpenses,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to submit expenses' });
    }
  });
  
  
  router.get('/get-expenses-for-month/:month', async (req, res) => {
    const { month } = req.params;

    try {
        const startOfMonth = DateTime.fromISO(`${month}-01`).startOf('month').toJSDate();
        const endOfMonth = DateTime.fromISO(`${month}-01`).endOf('month').toJSDate();

        console.log('Start of Month:', startOfMonth);
        console.log('End of Month:', endOfMonth);

        const monthExpenses = await Expense.find({
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        console.log(monthExpenses);
        if (monthExpenses.length === 0) {
            return res.status(404).json({ message: 'No expenses found for this month' });
        }

        res.status(200).json({ monthExpenses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
});

router.post('/add-expenses', async (req, res) => {
    const { expenses } = req.body;

    // Verify the token (ensure the user is authenticated)
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        // Create or update expenses for the user
        const existingExpenses = await Expense.findOne({ userId, month: new Date().toISOString().slice(0, 7) });

        if (existingExpenses) {
            // Update the existing expenses if found
            existingExpenses.expenses = expenses;
            await existingExpenses.save();
        } else {
            // Create new expenses record if none found
            const newExpense = new Expense({
                userId,
                month: new Date().toISOString().slice(0, 7),
                expenses,
            });
            await newExpense.save();
        }

        res.status(200).json({ success: true, message: 'Expenses added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to add expenses' });
    }
});
 
router.get('/get-monthly-expenses', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id; // Get the user's ID from the token

        const expenses = await Expense.find({ userId }); // Fetch the expenses for the logged-in user

        if (!expenses || expenses.length === 0) {
            return res.status(404).json({ message: 'No expenses found' });
        }

        res.json({ monthExpenses: expenses }); // Return expenses wrapped in monthExpenses
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/save-expenses', authenticate, async (req, res) => {
    try {
        const { expenses } = req.body; // Extract expenses from the request body
        const userId = req.userId; // userId is added by authenticate middleware

        // Validate input
        if (!Array.isArray(expenses) || expenses.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Expenses are required and cannot be empty.' 
            });
        }

        // Validate expense structure
        for (const expense of expenses) {
            if (!expense.title || expense.amount === undefined || expense.amount === null) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Each expense must have a title and amount.' 
                });
            }
        }

        // Upsert draft expenses for the user
        const savedExpense = await AddExpense.findOneAndUpdate(
            { userId, status: 'draft' }, // Find existing draft for the user
            { $set: { expenses, status: 'draft' } }, // Update expenses data
            { new: true, upsert: true } // Create a new record if it doesn't exist
        );

        return res.json({ 
            success: true, 
            message: 'Expenses saved successfully.', 
            data: savedExpense 
        });
    } catch (error) {
        console.error('Error saving expenses:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error. Please try again later.' 
        });
    }
});

router.get('/get-saved-expenses', authenticate, async (req, res) => {
    try {
        const userId = req.userId; // Extracted by authenticate middleware

        const savedExpenses = await AddExpense.findOne({ userId, status: 'draft' }) || await AddExpense.findOne({ userId, status: 'submitted' });

        if (!savedExpenses) {
            return res.status(404).json({ 
                success: false, 
                message: 'No saved expenses found for this user.' 
            });
        }

        return res.json({ 
            success: true, 
            data: savedExpenses.expenses 
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error. Please try again later.' 
        });
    }
});

router.post('/submit-adddExpenses', authenticate, async (req, res) => {
    try {
        const userId = req.userId; // Extracted by authenticate middleware
        const { expenses } = req.body; // The expenses submitted from the form

        if (!expenses || expenses.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Expenses are required to submit.' 
            });
        }

        // Find the existing saved draft for the user
        const savedExpenses = await AddExpense.findOne({ userId, status: 'draft' });

        if (!savedExpenses) {
            return res.status(404).json({ 
                success: false, 
                message: 'No draft expenses found for this user.' 
            });
        }

        // Update the expenses and change the status to 'submitted'
        savedExpenses.expenses = expenses; // Update expenses with the submitted values
        savedExpenses.status = 'submitted'; // Change status to 'submitted'
        await savedExpenses.save(); // Save the updated record

        return res.json({ 
            success: true, 
            message: 'Expenses submitted successfully.', 
            data: savedExpenses 
        });
    } catch (error) {
        console.error('Error submitting expenses:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error. Please try again later.' 
        });
    }
});

const CompExpense = mongoose.model("Expense"); // Planned expenses
const CompAddExpense = mongoose.model("AddExpense"); // Actual expenses

// API to fetch and compare planned vs. actual expenses
router.get("/expense/comparison", authenticate, async (req, res) => {
    try {
      const userId = req.userId; // Assume userId is available via authentication middleware
  
      // Fetch planned expenses from `expense` collection
      const plannedExpenses = await CompExpense.find({ userId });
  
      // Fetch actual expenses from `addexpense` collection
      const addExpense = await CompAddExpense.findOne({ userId, status: "submitted" });
  
      if (!addExpense || !addExpense.expenses.length) {
        return res.status(404).json({
          success: false,
          message: "No actual expenses found for the user.",
        });
      }
  
      // Create a comparison object for each category
      const expenseComparison = plannedExpenses.map((planned) => {
        const actualExpense = addExpense.expenses.find(
          (actual) => actual.title === planned.title
        );
        
        const actualAmount = actualExpense ? actualExpense.amount : 0;
        const difference = planned.amount - actualAmount;
        const percentageDifference = planned.amount > 0 ? ((difference / planned.amount) * 100).toFixed(2) : 0;
  
        return {
          category: planned.title,
          plannedAmount: planned.amount,
          actualAmount: actualAmount,
          difference: difference,
          percentageDifference: parseFloat(percentageDifference),
        };
      });
  
      // Calculate total planned and actual expenses
      const totalPlanned = plannedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalActual = addExpense.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const overallDifference = totalPlanned - totalActual;
      const overallPercentageDifference = totalPlanned > 0 ? ((overallDifference / totalPlanned) * 100).toFixed(2) : 0;
  
      res.status(200).json({
        success: true,
        expenseComparison,
        totalPlanned,
        totalActual,
        overallDifference,
        overallPercentageDifference: parseFloat(overallPercentageDifference),
      });
    } catch (error) {
      console.error("Error fetching expense comparison:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  
  router.get("/dashboard", authenticate, async (req, res) => {
    try {
      const userId = req.userId; // Assume userId is available via authentication middleware
  
      // Fetch user profile details
      const userProfile = await Profile.findOne({ userId });
      if (!userProfile) {
        return res.status(404).json({ success: false, message: "Profile not found." });
      }
  
      // Fetch latest planned expenses from `expense` collection
      const plannedExpenses = await CompExpense.find({ userId });
  
      // Fetch actual expenses from `addexpense` collection
      const addExpense = await CompAddExpense.findOne({ userId, status: "submitted" });
  
      if (!addExpense || !addExpense.expenses.length) {
        return res.status(404).json({ success: false, message: "No actual expenses found." });
      }
  
      // Fetch latest income from `income` collection
      const latestIncome = await Income.findOne({ userId }).sort({ date: -1 });
  
      if (!latestIncome) {
        return res.status(404).json({ success: false, message: "Income details not found." });
      }
  
      // Prepare dashboard data
      const expenseComparison = plannedExpenses.map((planned) => {
        const actualExpense = addExpense.expenses.find(
          (actual) => actual.title === planned.title
        );
        
        const actualAmount = actualExpense ? actualExpense.amount : 0;
        const difference = planned.amount - actualAmount;
        const percentageDifference = planned.amount > 0 ? ((difference / planned.amount) * 100).toFixed(2) : 0;
  
        return {
          category: planned.title,
          plannedAmount: planned.amount,
          actualAmount: actualAmount,
          difference: difference,
          percentageDifference: parseFloat(percentageDifference),
        };
      });
  
      // Calculate total planned and actual expenses
      const totalPlanned = plannedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalActual = addExpense.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const overallDifference = totalPlanned - totalActual;
      const overallPercentageDifference = totalPlanned > 0 ? ((overallDifference / totalPlanned) * 100).toFixed(2) : 0;
  
      res.status(200).json({
        success: true,
        userProfile,
        latestIncome,
        expenseComparison,
        totalPlanned,
        totalActual,
        overallDifference,
        overallPercentageDifference: parseFloat(overallPercentageDifference),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

   
module.exports = router;
