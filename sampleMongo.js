// sampleMongo.js
const mongoose = require('mongoose');

async function main() {
  /* 1️⃣  CONNECT  */
  await mongoose.connect('mongodb://localhost:27017/myDB');   // or your Atlas URI
  console.log('✓ Connected to MongoDB');


  const studentSchema = new mongoose.Schema({
    rollNo: { type: Number, required: true, unique: true },
    name:   { type: String, required: true },
    age:    Number
  });

  const Student = mongoose.model('Student', studentSchema);

  const s = await Student.create({ rollNo: 1, name: 'Aditi', age: 20 });
  console.log('Inserted:', s);
  
  await mongoose.connection.close();
  console.log('✓ Connection closed');
}

main().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
