const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    designation: { type: String, required: true },
    image: { type: String, default: null },
  });

module.exports = mongoose.model('Profile', ProfileSchema);