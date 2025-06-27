const mongoose = require("mongoose");

const testSetSchema = new mongoose.Schema({
  name: String,
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
});

module.exports = mongoose.model("TestSet", testSetSchema);
