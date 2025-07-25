const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    employeeId: String, // Changed from username to employeeId
    name: String,
    age: Number,
    email: String,
    password: String,
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }], // Linking students
});

module.exports = mongoose.model("Teacher", teacherSchema);