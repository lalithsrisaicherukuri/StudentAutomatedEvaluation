const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true }, // Ensure studentId is required and unique
    name: String,
    age: Number,
    grade: Number,
    writtenGrade : Number,
    password: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" } ,// Linking to Teacher
    marks:[Number],
    writtenMarks : [Number],
    totalWrittenMarks : [Number],
    submittedTests: [{ type: mongoose.Schema.Types.ObjectId, ref: "TestSet" }]

});

module.exports = mongoose.model("Student", studentSchema);
