const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = User = mongoose.model('users', userSchema);