const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
    CompanyName: String,
    Details: String,
    Validity: Date
});

module.exports = Job = mongoose.model('jobs', JobSchema);