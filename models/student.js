const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true }, // Ensure studentId is required and unique
    name: String,
    age: Number,
    grade: Number,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" } // Linking to Teacher
});

module.exports = mongoose.model("Student", studentSchema);
